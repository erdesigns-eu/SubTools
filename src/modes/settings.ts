import { askQuestion, createValidator, readSettings, writeSettings, clearTerminal } from '../lib/common.js';
import { openAIModels } from '../translators/srtOpenAI.js'
import type { OpenAIModel } from '../translators/srtOpenAI.js';

/**
 * The list of available translators.
 * @type {string[]}
 */
const translators: string[] = ['OpenAI', 'Google AI', 'DeepL', 'Google Translate'];

/**
 * Translator mode.
 * In this mode, the user can configure the translator settings.
 * @returns {Promise<void>} Nothing
 */
async function translator(): Promise<void> {
    const translator = await askQuestion(`🟣 Select a translator (${translators.join(', ')}): `);
    
    let lowercaseTranslator = translator.toLowerCase();
    const lowercaseTranslators = translators.map((t) => t.toLowerCase());
    
    const translatorIndex = parseInt(translator, 10);
    const translatorByIndex = translators[translatorIndex - 1];
    
    if (translatorIndex && translatorByIndex) {
        lowercaseTranslator = translatorByIndex.toLowerCase();
    }

    if (!translator) {
        throw new Error('No translator selected.');
    }
    if (!lowercaseTranslators.includes(lowercaseTranslator)) {
        throw new Error(`Invalid translator selected. Please select one of the following: ${translators.join(', ')}`);
    }

    const batchSize = parseInt(await askQuestion('🟣 Enter the batch size: '), 10);
    if (!batchSize) {
        throw new Error('No batch size provided.');
    }
    if (isNaN(batchSize)) {
        throw new Error('Invalid batch size provided.');
    }
    if (batchSize < 1 || batchSize > 2500) {
        throw new Error('Batch size must be between 1 and 2500.');
    }

    const concurrentRequests = parseInt(await askQuestion('🟣 Enter the number of concurrent requests: '), 10);
    if (!concurrentRequests) {
        throw new Error('No number of concurrent requests provided.');
    }
    if (isNaN(concurrentRequests)) {
        throw new Error('Invalid number of concurrent requests provided.');
    }
    if (concurrentRequests < 1 || concurrentRequests > 25) {
        throw new Error('Number of concurrent requests must be between 1 and 25.');
    }

    // Read the current settings
    const storedSettings = await readSettings();
    // Update the translator settings
    storedSettings.translator = lowercaseTranslator;
    storedSettings.batchSize = batchSize;
    storedSettings.concurrentRequests = concurrentRequests;
    // Write the updated settings to disk
    await writeSettings(storedSettings);

    const translatorName = translators.find((t) => t.toLowerCase() === lowercaseTranslator);
    // Log that the settings have been saved
    clearTerminal(`🟢 Translator set to ${translatorName}`);
}

/**
 * OpenAI mode.
 * In this mode, the user can configure the OpenAI API settings.
 * @returns {Promise<void>} Nothing
 */
async function openai(): Promise<void> {
    const apiKey = await askQuestion('🟣 Enter the OpenAI API Key: ');
    if (!apiKey) {
        throw new Error('No API Key provided.');
    }

    const model = await askQuestion('🟣 Enter the OpenAI Model: ')
    if (!model) {
        throw new Error('No Model provided.');
    }
    if (!openAIModels.includes(model as OpenAIModel)) {
        throw new Error(`Invalid model selected. Please select one of the following: ${openAIModels.join(', ')}`);
    }

    // Read the current settings
    const storedSettings = await readSettings();
    // Update the OpenAI settings
    storedSettings.openai = {
        apiKey,
        model
    };
    // Write the updated settings to disk
    await writeSettings(storedSettings);

    // Log that the settings have been saved
    clearTerminal('🟢 OpenAI settings saved.');
}

/**
 * Google AI mode.
 * In this mode, the user can configure the GoogleAI API settings.
 * @returns {Promise<void>} Nothing
 */
async function googleAI(): Promise<void> {
    const apiKey = await askQuestion('🟣 Enter the Google AI API Key: ');
    if (!apiKey) {
        throw new Error('No API Key provided.');
    }

    const model = await askQuestion('🟣 Enter the Google AI Model: ')
    if (!model) {
        throw new Error('No Model provided.');
    }
    // Check if the model is valid
    // TODO

    // Read the current settings
    const storedSettings = await readSettings();
    // Update the Google AI settings
    storedSettings.googleai = {
        apiKey,
        model
    };
    // Write the updated settings to disk
    await writeSettings(storedSettings);

    // Log that the settings have been saved
    clearTerminal('🟢 Google AI settings saved.');
}

/**
 * DeepL mode.
 * In this mode, the user can configure the DeepL API settings.
 * @returns {Promise<void>} Nothing
 */
async function deepL(): Promise<void> {
    const apiKey = await askQuestion('🟣 Enter the DeepL API Key: ');
    if (!apiKey) {
        throw new Error('No API Key provided.');
    }

    // Read the current settings
    const storedSettings = await readSettings();
    // Update the DeepL settings
    storedSettings.deepl = {
        apiKey
    };
    // Write the updated settings to disk
    await writeSettings(storedSettings);

    // Log that the settings have been saved
    clearTerminal('🟢 DeepL settings saved.');
}

/**
 * Settings mode.
 * In this mode, the user can change the application settings.
 * @returns {Promise<void>} Nothing
 */
export default async function(): Promise<void> {
    // Error message for invalid input
    const errorMessage = '🔴 Invalid mode selected. Please select either "Translator", "OpenAI", "Google AI", "Deepl" or "Help".';
    // Validator function
    const validator = createValidator([1, 2, 3, 4, 5], ['translator', 'openai', 'googleai', 'google ai', 'deepl', 'help']);
    // Ask the user what they want to do
    const action = await askQuestion('🟣 Select a setting (Translator, OpenAI, Google AI, Deepl, or Help): ', validator, errorMessage);
    // Switch on the action
    switch (action.toLowerCase()) {
        case 'translator':
        case '1':
            await translator();
            break;
        case 'openai':
        case '2':
            await openai();
            break;
        case 'googleai':
        case 'google ai':
        case '3':
            await googleAI();
            break;
        case 'deepl':
        case '4':
            await deepL();
            break;
        case 'help':
        case '5':
            console.log('🟣 1. Translator - Change the translator that is used for translating subtitles.');
            console.log('🟣 2. OpenAI     - Change the OpenAI API settings.');
            console.log('🟣 3. Google AI  - Change the Google AI API settings.');
            console.log('🟣 4. DeepL      - Change the DeepL API settings.');
            console.log('🟣 4. Help       - Show this help message.');
            break;
        default:
            throw new Error('Invalid setting selected. Please select either "Translator", "OpenAI", "Google AI", "DeepL" or "Help".');
    }
}