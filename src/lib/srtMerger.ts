import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';
import getLanguageInfo from './languages.js';

/**
 * Represents an SRT subtitle entry.
 * @property {string} content - The content of the subtitle.
 * @property {string} language - The language of the subtitle.
 * @property {number} index - The new index of the subtitle in the video file.
 */
type SRTEntry = {
    content: string;
    language: string;
    index: number;
};

/**
 * Merges SRT subtitles with a video file using FFmpeg (MKV, MP4, etc.)
 * @class SRTMerger
 */
class SRTMerger {
    /**
     * Video file path to merge subtitles with.
     * @type {string} videoFile
     */
    private videoFile: string;

    /**
     * Suffix to add to the output video file.
     * @type {string} outputSuffix
     */
    private outputSuffix: string = '_new';

    /**
     * Creates a new instance of the SRTMerger class.
     * @param {string} videoFile - The video file to merge subtitles with.
     * @constructor
     */
    constructor(videoFile: string, outputSuffix?: string) {
        // Set the video file path of the video to merge subtitles with
        this.videoFile = videoFile;
        // Set the output suffix if provided
        if (outputSuffix) {
            this.outputSuffix = outputSuffix;
        }
    }

    /**
     * Get a random temporary file path with the specified extension.
     * @param extension - The file extension to use.
     * @returns {string} A random temporary file path.
     */
    private getRandomTempFile(extension: string): string {
        return path.join(os.tmpdir(), `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`);
    }

    /**
     * Removes a temporary file.
     * @param tempFile - The path to the temporary file.
     * @returns {Promise<void>} A promise that resolves when the file is removed.
     */
    private removeTempFile(tempFile: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.unlink(tempFile, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }

    /**
     * Merges the provided subtitles with the video file.
     * @param subtitles - The subtitles to merge.
     * @returns {Promise<void>} A promise that resolves when the subtitles are merged.
     */
    public mergeSubtitles(subtitles: SRTEntry[]): Promise<void> {
        return new Promise((resolve, reject) => {
            // Create temporary subtitle files for each subtitle content
            const tempSubtitleFiles = subtitles.map((subtitle) => {
                // Create a temporary file for the subtitle content
                const tempFile = this.getRandomTempFile('srt');
                // Write the subtitle content to the temporary file
                fs.writeFileSync(tempFile, subtitle.content, 'utf8');
                // Get the language information for the subtitle
                const languageInfo = getLanguageInfo(subtitle.language);

                // Return the temporary file path and language information
                return {
                    file: tempFile,
                    language: languageInfo?.threeLetterCode ?? subtitle.language,
                    title: languageInfo?.languageName ?? subtitle.language,
                    locale: languageInfo?.localeName ?? subtitle.language,
                    index: subtitle.index,
                };
            });

            // Prepare the output filename with the suffix added
            const outputFilename = this.videoFile.replace(/\.[^.]+$/, `${this.outputSuffix}$&`);
            
            // Prepare FFmpeg command to add all subtitles
            const command = ffmpeg(this.videoFile);

            // Add new subtitle files as inputs
            tempSubtitleFiles.forEach((fileObj) => {
                command.input(fileObj.file);
            });

            const videoIsMKV = this.videoFile.endsWith('.mkv');
            const subtitleFormat = videoIsMKV ? 'srt' : 'mov_text';

            command.output(outputFilename)   
                .outputOptions([
                    `-map 0`,                                                                        // Include all streams from the original video (video, audio, existing subtitles)
                    ...tempSubtitleFiles.map((_, index) => `-map ${index + 1}`),                     // Map each new subtitle input
                    `-c:v copy`,                                                                     // Copy video stream without re-encoding
                    `-c:a copy`,                                                                     // Copy audio stream without re-encoding
                    `-c copy`,                                                                       // Preserve format for existing subtitles
                    ...tempSubtitleFiles.map((_, index) => `-c:s:${index + 1} ${subtitleFormat}`),   // Convert newly added subtitles to the correct format
                    ...tempSubtitleFiles.map(
                        (fileObj) => `-metadata:s:s:${fileObj.index} language=${fileObj.language}`   // Set the language metadata for each subtitle
                    ),
                    ...tempSubtitleFiles.map(
                        (fileObj) => `-metadata:s:s:${fileObj.index} handler_name=${fileObj.title}`  // Set the handler name for each subtitle
                    ),
                    ...tempSubtitleFiles.map(
                        (fileObj) => `-metadata:s:s:${fileObj.index} title=${fileObj.locale}`        // Set the title for each subtitle
                    ),
                    '-movflags +faststart',                                                          // Optimize for streaming
                ]);
    
            // Clean up temporary files
            const cleanupTempFiles = async (): Promise<void> => {
                for (const fileObj of tempSubtitleFiles) {
                    await this.removeTempFile(fileObj.file);
                }
            };

            // Execute FFmpeg command to mux the subtitles into the video
            // and resolve when the command completes successfully or reject on error
            // with the error message.
            command
                .on('start', (command) => {
                    console.log('command:', command);
                    console.log('🟡 Merging subtitles with video...');
                })
                .on('end', async () => {
                    await cleanupTempFiles(); // Clean up temporary files on completion
                    resolve();                // Resolve the promise when done
                })
                .on('error', async (error) => {
                    await cleanupTempFiles(); // Clean up temporary files on error
                    reject(error);            // Reject the promise with the error
                })
                .run();                       // Run the FFmpeg command
        });
    }
}

export default SRTMerger;