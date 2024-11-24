import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Represents an SRT subtitle entry.
 * @property {string} language - The language of the subtitle.
 * @property {string} title - The title of the subtitle.
 * @property {string} extension - The file extension of the subtitle.
 * @property {number} index - The index of the subtitle stream.
 */
type SRTEntry = {
    language: string | undefined;
    title: string | undefined;
    extension: string | undefined;
    index: number;
};

/**
 * Extracts SRT subtitles from a video file using FFmpeg (MKV, MP4, etc.)
 * @class SRTExtractor
 */
class SRTExtractor {
    /**
     * Video file path to extract subtitles from.
     * @type {string} videoFile
     */
    private videoFile: string;

    /**
     * Map of codec names to file extensions.
     * @type {Record<string, string>} codecMap
     */
    private codecMap: Record<string, string> = {
        subrip: 'srt',            // SubRip subtitle format, common in video files
        webvtt: 'vtt',            // Web Video Text Tracks, used for web-based video
        ass: "ass",               // Advanced SubStation Alpha, supports rich formatting
        ssa: "ssa",               // SubStation Alpha, predecessor of ASS
        mov_text: "mp4",          // Text subtitles embedded in MP4 containers
        microdvd: "sub",          // MicroDVD subtitle format, legacy format
        sami: "smi",              // Synchronized Accessible Media Interchange, used for accessibility
        realtext: "rt",           // RealText format, used with RealMedia
        hdmv_pgs_subtitle: "pgs", // Presentation Graphics Stream, used in Blu-ray
        dvd_subtitle: "sub",      // DVD subtitle format, often paired with .idx
        xsub: "avi",              // DivX subtitles, embedded in AVI files
        dvb_subtitle: "dvb",      // DVB subtitles, used in digital broadcasting
        text: "txt",              // Plain text subtitles
        srt: "srt",               // Another common SubRip subtitle format (redundant alias)
        stl: "stl",               // EBU STL (European Broadcasting Union), used in broadcasting
        teletext: "teletext",     // Teletext subtitles, for older TV systems
        vplayer: "vpl",           // VPlayer subtitles, legacy format
        jacosub: "jss",           // JACOsub subtitle format, supports styled text
        mpl2: "mpl",              // MPL2 subtitle format, simple and time-based
        pjs: "pjs",               // Phoenix Japanimation Society, legacy format
        aqt: "aqt",               // AQTitle, used in older subtitle systems
    };
    

    /**
     * Creates a new instance of the SRTExtractor class.
     * @param {string} videoFile - The video file to extract subtitles from.
     * @constructor
     */
    constructor(videoFile: string) {
        // Set the video file path of the video to extract subtitles from
        this.videoFile = videoFile;
    }

    /**
     * Get subtitle file extension from the codec name.
     * @param codec - The codec name
     * @returns The file extension of the codec or fallback to '.txt'
     */
    private getExtensionFromCodec(codec: string|undefined): string {
        if (!codec) {
            return '.txt';
        }

        return this.codecMap[codec];
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
     * Reads the content of a temporary file.
     * @param tempFile - The path to the temporary file.
     * @returns {Promise<string>} A promise that resolves with the file content.
     */
    private readTempFile(tempFile: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(tempFile, 'utf8', (error, data) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(data);
                }
            });
        });
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
     * Lists the available subtitles in the video file.
     * @param {boolean} srtOnly - Whether to only list SRT subtitles.
     * @returns {Promise<SRTEntry[]>} A promise that resolves with an array of subtitle entries.
     */
    public async listSubtitles(srtOnly: boolean = false): Promise<SRTEntry[]> {
        // Filter function to check if the stream is a subtitle stream
        const subtitleFilter = (stream: ffmpeg.FfprobeStream) => stream.codec_type === 'subtitle' && (srtOnly ? stream.codec_name === 'subrip' : true);
        // Map function to extract the language tag from the stream
        const map = (stream: ffmpeg.FfprobeStream) => ({ language: stream.tags?.language, title: stream.tags?.title, extension: this.getExtensionFromCodec(stream.codec_name), index: stream.index });
        // Filter function to remove streams without a language tag
        const languageFilter = (sub: { language: string | undefined; index: number }) => sub.language;
        
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(this.videoFile, (error, metadata) => {
                // If there is an error, reject the promise with the error
                if (error) {
                    reject(error);
                }

                // Otherwise, resolve the promise with the list of subtitles
                else {
                    resolve(
                        metadata.streams
                        .filter(subtitleFilter) // Filter out non-subtitle streams
                        .map(map)               // Extract language tag and index
                        .filter(languageFilter) // Remove streams without a language tag (undefined)
                    );
                }
            });
        });
    }

    /**
     * Extracts the subtitle content from the video file.
     * @param {string} language - The language of the subtitle to extract.
     * @returns {Promise<string>} A promise that resolves with the subtitle content in SRT format or rejects with an error message.
     */
    private async extractSubtitleToTempFile(language: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Create a temporary file path for the extracted subtitle
            const tempFile = this.getRandomTempFile('srt');

            // Extract the subtitle stream from the video file
            ffmpeg(this.videoFile)
                .noAudio()                               // Disable audio output
                .noVideo()                               // Disable video output
                .output(tempFile)                        // Set the output file path
                .outputOptions([
                    '-map', `0:m:language:${language}`,  // Map the subtitle stream by language
                ])
                .on('end', () => resolve(tempFile))      // Resolve the promise on completion with the temp file path
                .on('error', (error) => reject(error))   // Reject the promise on error
                .run();
        });
    }

    /**
     * Extracts the subtitle content from the video file.
     * @param {string} language - The language of the subtitle to extract.
     * @returns {Promise<string>} A promise that resolves with the subtitle content in SRT format.
     */
    public async extractSubtitle(language: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let tempFile: string;

            this.extractSubtitleToTempFile(language)           // Extract the subtitle to a temporary file
                .then((filename) => {
                    tempFile = filename;                       // Store the temporary file path for cleanup
                    return this.readTempFile(filename);        // Read the content of the temporary file
                })
                .then((content) => resolve(content))           // Resolve the promise with the content
                .catch((error) => reject(error))               // Reject the promise with an error message
                .finally(() => this.removeTempFile(tempFile)); // Clean up the temporary file
        });
    }
}

export default SRTExtractor;