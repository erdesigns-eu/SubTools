import { askQuestion, readFile, writeFile, getTranslator, getBatchSize, getConcurrentRequests, getTranslatorSettings, formatDuration } from "../lib/common.js";
import type { SRTTranslateMethod } from "../lib/srtTranslator.js";
import SRTParser from '../lib/srtParser.js';
import SRTTranslator from '../lib/srtTranslator.js';
import SRTExtractor from '../lib/srtExtractor.js';
import SRTMerger from "../lib/srtMerger.js";
import SRTOpenAI from '../translators/srtOpenAI.js';

/**
 * Translate a subtitle file to another language.
 * @returns {void} Nothing
 */
async function translate(): Promise<void> {
    const filename = await askQuestion('🟣 Enter the filename of the subtitle file: ');
    if (!filename) {
        throw new Error('No filename provided.');
    }
    if (!filename.endsWith('.srt')) {
        throw new Error('Invalid file extension. Please provide a .srt file.');
    }

    const sourceLanguage = await askQuestion('🟣 Enter the source language (e.g. en): ');
    if (!sourceLanguage) {
        throw new Error('No source language provided.');
    }

    const targetLanguage = await askQuestion('🟣 Enter the target language (e.g. nl): ')
    if (!targetLanguage) {
        throw new Error('No target language provided.');
    }

    // Create a new SRTParser instance
    const parser = new SRTParser();
    // Read the SRT file
    const subtitleContent = await readFile(filename);
    // Parse the SRT file into an array of caption objects
    const captions = parser.parse(subtitleContent);

    // Get the translator from the settings
    const translator = await getTranslator();
    // Get the batch size from the settings
    const batchSize = await getBatchSize();
    // Get the number of concurrent requests from the settings
    const concurrentRequests = await getConcurrentRequests();
    // Get the translator settings
    const translatorSettings = await getTranslatorSettings(translator);

    let translateMethod: SRTTranslateMethod;
    switch (translator) {
        case 'openai':
            translateMethod = new SRTOpenAI({
                apiKey: translatorSettings.apiKey,
                model: translatorSettings.model,
            }).translate;
            break;
        default:
            throw new Error(`Translator "${translator}"is not implemented yet.`);
    }

    // Create a new SRTTranslator instance
    const translatorInstance = new SRTTranslator({
        batchSize,
        concurrentRequests,
        sourceLanguage,
        targetLanguage,
        translateMethod,
    });

    // Log the start of the translation
    const onStart = ({ captions, batches}: { captions: number, batches: number }) => {
        console.log(`🟡 Translating ${captions} captions in ${batches} batches...`);
    };

    // Log the finish of the translation
    const onFinish = ({ durationFormatted }: { durationFormatted: string }) => {
        console.log(`🟡 Translation completed in ${durationFormatted}`);
    };

    // Log an error during the translation
    const onError = (error: string) => {
        throw new Error(error);
    };

    // Listen for events
    translatorInstance.on('start', onStart);
    translatorInstance.on('finish', onFinish);
    translatorInstance.on('error', onError);

    // Translate the captions
    const translatedCaptions = await translatorInstance.translate(captions);

    // Remove the event listeners
    translatorInstance.off('start', onStart);
    translatorInstance.off('finish', onFinish);
    translatorInstance.off('error', onError);

    // Save the translated captions to a new SRT file
    const translatedSubtitleContent = parser.stringify(translatedCaptions);
    const newFilename = filename.replace('.srt', `.${targetLanguage}.srt`);
    await writeFile(newFilename, translatedSubtitleContent);
    
    // Log the result
    console.log(`🟢 Translated subtitle saved to ${newFilename}`);
}

/**
 * Extract a subtitle file from a video file.
 * @returns {void} Nothing
 */
async function extract(): Promise<void> {
    const filename = await askQuestion('🟣 Enter the filename of the video file: ');
    if (!filename) {
        throw new Error('No filename provided.');
    }
    if (!filename.endsWith('.mp4') && !filename.endsWith('.mkv')) {
        throw new Error('Invalid file extension. Please provide a .mp4 or .mkv file.');
    }

    // Get the filename without the extension
    const filenameWithoutExtension = filename.replace(/\.[^/.]+$/, '');

    // Create a new SRTExtractor instance
    const extractor = new SRTExtractor(filename);
    // Get the available subtitles in the video file (SRT only)
    const subtitles = await extractor.listSubtitles(true);

    if (subtitles.length === 0) {
        throw new Error('No subtitles found in the video file.');
    }
    
    // Print the available subtitles
    console.log('🟣 Available subtitles:');
    subtitles.forEach((subtitle) => {
        console.log(`🟡 ${subtitle.index}. ${subtitle.language} ${subtitle.title ? `(${subtitle.title})` : ''}`);
    });

    const firstIndex = subtitles[0].index;
    const lastIndex = subtitles[subtitles.length - 1].index;

    const selection = await askQuestion('🟣 Select a subtitle to extract: ');
    if (!selection) {
        throw new Error('No subtitle selected.');
    }
    
    const subtitle = parseInt(selection, 10);
    if (isNaN(subtitle) || subtitle < firstIndex || subtitle > lastIndex) {
        throw new Error(`Invalid subtitle selected. Please select a number between ${firstIndex} and ${lastIndex}.`);
    }

    // Get the language of the subtitle
    const language = subtitles.find((s) => s.index === subtitle)?.language ?? 'unknown';
    // Extract the selected subtitle
    const srtContent = await extractor.extractSubtitle(language);
    // Get the file extension of the subtitle
    const fileExtension = subtitles.find((s) => s.index === subtitle)?.extension ?? 'txt';
    // Save the extracted subtitle to a new file
    const srtFilename = `${filenameWithoutExtension}.${language}.${fileExtension}`;
    // Write the subtitle content to the file
    await writeFile(srtFilename, srtContent);

    // Log the result
    console.log(`🟢 Extracted subtitle saved to ${srtFilename}`);
}

/**
 * Merge a subtitle file with a video file.
 * @returns {void} Nothing
 */
async function merge(): Promise<void> {
    const videoFilename = await askQuestion('🟣 Enter the filename of the video file: ');
    if (!videoFilename) {
        throw new Error('No filename provided.');
    }
    if (!videoFilename.endsWith('.mp4') && !videoFilename.endsWith('.mkv')) {
        throw new Error('Invalid file extension. Please provide a .mp4 or .mkv file.');
    }

    const subtitleFilename = await askQuestion('🟣 Enter the filename of the subtitle file: ');
    if (!subtitleFilename) {
        throw new Error('No filename provided.');
    }
    if (!subtitleFilename.endsWith('.srt')) {
        throw new Error('Invalid file extension. Please provide a .srt file.');
    }

    const subtitleLanguage = await askQuestion('🟣 Enter the language of the subtitle (e.g. en, nl): ');
    if (!subtitleLanguage) {
        throw new Error('No language provided.');
    }

    // Create a new SRTMerger instance
    const merger = new SRTMerger(videoFilename);
    // Read the SRT file
    const subtitleContent = await readFile(subtitleFilename);
    
    // Create a new SRTParser instance
    const parser = new SRTParser();
    // Parse the SRT file into an array of caption objects
    const captions = parser.parse(subtitleContent);
    if (captions.length === 0) {
        throw new Error('No captions found in the subtitle file.');
    }

    // Create a new SRTExtractor instance
    const extractor = new SRTExtractor(videoFilename);
    // Get the available subtitles in the video file (All formats)
    const subtitles = await extractor.listSubtitles();

    // Get the index of the last subtitle in the video file
    const lastSubtitleIndex = subtitles.length > 0 ? subtitles[subtitles.length - 1].index : 0;

    // Merge the subtitles with the video file
    await merger.mergeSubtitles([{
        content: subtitleContent,
        language: subtitleLanguage,
        index: lastSubtitleIndex - 1,
    }]);

    // Log the result
    console.log('🟢 Merged subtitle with video file.');
}

/**
 * Extract a subtitle, translate, and merge it with the video.
 * In this mode, the user can select a single Video file to process.
 * @returns {Promise<void>} Nothing
 */
async function all(): Promise<void> {
    const filename = await askQuestion('🟣 Enter the filename of the video file: ');
    if (!filename) {
        throw new Error('No filename provided.');
    }
    if (!filename.endsWith('.mp4') && !filename.endsWith('.mkv')) {
        throw new Error('Invalid file extension. Please provide a .mp4 or .mkv file.');
    }

    // Record the start time of the process to calculate the duration later
    const startTime: number = Date.now();

    // Create a new SRTExtractor instance
    const extractor = new SRTExtractor(filename);
    // Get the available subtitles in the video file (SRT only)
    const subtitles = await extractor.listSubtitles(true);

    if (subtitles.length === 0) {
        throw new Error('No subtitles found in the video file.');
    }
    
    // Print the available subtitles
    console.log('🟣 Available subtitles:');
    subtitles.forEach((subtitle) => {
        console.log(`🟡 ${subtitle.index}. ${subtitle.language} ${subtitle.title ? `(${subtitle.title})` : ''}`);
    });

    const firstIndex = subtitles[0].index;
    const lastIndex = subtitles[subtitles.length - 1].index;

    const selection = await askQuestion('🟣 Select a subtitle to translate: ');
    if (!selection) {
        throw new Error('No subtitle selected.');
    }
    
    const subtitle = parseInt(selection, 10);
    if (isNaN(subtitle) || subtitle < firstIndex || subtitle > lastIndex) {
        throw new Error(`Invalid subtitle selected. Please select a number between ${firstIndex} and ${lastIndex}.`);
    }

    // Get the language of the subtitle
    const sourceLanguage = subtitles.find((s) => s.index === subtitle)?.language ?? 'unknown';
    // Extract the selected subtitle
    const srtContent = await extractor.extractSubtitle(sourceLanguage);
    
    const targetLanguage = await askQuestion('🟣 Enter the target language (e.g. nl): ')
    if (!targetLanguage) {
        throw new Error('No target language provided.');
    }

    // Create a new SRTParser instance
    const parser = new SRTParser();
    // Parse the SRT file into an array of caption objects
    const captions = parser.parse(srtContent);

    // Get the translator from the settings
    const translator = await getTranslator();
    // Get the batch size from the settings
    const batchSize = await getBatchSize();
    // Get the number of concurrent requests from the settings
    const concurrentRequests = await getConcurrentRequests();
    // Get the translator settings
    const translatorSettings = await getTranslatorSettings(translator);

    let translateMethod: SRTTranslateMethod;
    switch (translator) {
        case 'openai':
            translateMethod = new SRTOpenAI({
                apiKey: translatorSettings.apiKey,
                model: translatorSettings.model,
            }).translate;
            break;
        default:
            throw new Error(`Translator "${translator}"is not implemented yet.`);
    }

    // Create a new SRTTranslator instance
    const translatorInstance = new SRTTranslator({
        batchSize,
        concurrentRequests,
        sourceLanguage,
        targetLanguage,
        translateMethod,
    });

    // Log the start of the translation
    const onStart = ({ captions, batches}: { captions: number, batches: number }) => {
        console.log(`🟡 Translating ${captions} captions in ${batches} batches...`);
    };

    // Log the finish of the translation
    const onFinish = ({ durationFormatted }: { durationFormatted: string }) => {
        console.log(`🟡 Translation completed in ${durationFormatted}`);
    };

    // Log an error during the translation
    const onError = (error: string) => {
        throw new Error(error);
    };

    // Listen for events
    translatorInstance.on('start', onStart);
    translatorInstance.on('finish', onFinish);
    translatorInstance.on('error', onError);

    // Translate the captions
    const translatedCaptions = await translatorInstance.translate(captions);

    // Remove the event listeners
    translatorInstance.off('start', onStart);
    translatorInstance.off('finish', onFinish);
    translatorInstance.off('error', onError);

    // Save the translated captions to a new SRT file
    const translatedSubtitleContent = parser.stringify(translatedCaptions);

    // Create a new SRTMerger instance
    const merger = new SRTMerger(filename);

    // Get the index of the last subtitle in the video file
    const lastSubtitleIndex = subtitles.length > 0 ? subtitles[subtitles.length - 1].index : 0;

    // Merge the subtitles with the video file
    await merger.mergeSubtitles([{
        content: translatedSubtitleContent,
        language: targetLanguage,
        index: lastSubtitleIndex - 1,
    }]);

    // Log the result
    console.log(`🟢 Translated and merged the subtitle in ${formatDuration((Date.now() - startTime) / 1000)}`);
}

/**
 * Single file mode.
 * In this mode, the user can select a single SRT or Video file to process.
 * @returns {Promise<void>} Nothing
 */
export default async function(): Promise<void> {
    // Ask the user what they want to do
    const action = await askQuestion('🟣 Select a action (Translate/Extract/Merge/All/Help): ');
    // Switch on the action
    switch (action.toLowerCase()) {
        case 'translate':
        case '1':
            await translate();
            break;
        case 'extract':
        case '2':
            await extract();
            break;
        case 'merge':
        case '3':
            await merge();
            break;
        case 'all':
        case '4':
            await all();
            break;
        case 'help':
        case '5':
            console.log('🟣 1. Translate - Translate a subtitle file to another language.');
            console.log('🟣 2. Extract   - Extract a subtitle file from a video file.');
            console.log('🟣 3. Merge     - Merge a subtitle file with a video file.');
            console.log('🟣 4. All       - Extract the selected subtitle, translate it to the defined language, and merge it with the video.');
            console.log('🟣 4. Help      - Show this help message.');
            break;
        default:
            throw new Error('Invalid action selected. Please select either "Translate", "Extract", "Merge", "All" or "Help".');
    }
}