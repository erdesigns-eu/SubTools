import fs from 'fs';
import fetch from 'node-fetch';
import SrtParser from 'srt-parser-2';
import readline from 'readline';

/**
 * OpenAI API Key.
 * @see https://platform.openai.com/docs/overview
 * @note Replace 'your_openai_api_key' with your actual OpenAI API key.
 */
const OPENAI_API_KEY = 'your_openai_api_key';

/**
 * OpenAI Model.
 * @see https://platform.openai.com/docs/models
 * @note You can replace this value with any other model available in your OpenAI account.
 * @note gpt-4o-mini is cheaper but might need more retries for longer texts, gpt-4o is more expensive but more accurate. 
 */
const OPENAI_MODEL = 'gpt-4o-mini';

/**
 * Default batch size for translation.
 * You can adjust this value to control how many captions are sent in a single batch.
 */
const DEFAULT_BATCH_SIZE = 500;

/**
 * Maximum batch size for translation.
 * You can adjust this value to control the maximum number of captions sent in a single batch.
 */
const MAX_BATCH_SIZE = 1000;

/**
 * Default source language for translation.
 * You can adjust this value to set the default source language for translation.
 */
const DEFAULT_SOURCE_LANG = 'en';

/**
 * Default target language for translation.
 * You can adjust this value to set the default target language for translation.
 */
const DEFAULT_TARGET_LANG = 'nl';

/**
 * Prompt to translate the JSON values from the source language to the target language.
 * @param sourceLanguage - The source language.
 * @param targetLanguage - The target language.
 * @returns The prompt to translate the JSON values.
 */
const TRANSLATE_PROMPT = (sourceLanguage: string, targetLanguage: string) => `
Translate the following JSON values from ${sourceLanguage} to ${targetLanguage}. 

- Only translate the **values** of the JSON object. **Do not modify, remove, or change any keys or the structure**.
- Ensure that the **exact structure** of the original JSON is preserved.
- For each key, provide the translated value. **Do not omit any key-value pairs**, even if a value is empty or seems irrelevant.
- The output should only contain the translated JSON object, without any extra explanations or text.
- The translated JSON object must be **valid JSON**. Ensure that **all keys remain the same**, and **no keys are missing or added**.
- If any value is empty or not translatable, leave it as is (do not remove the key), and simply provide the original value as is.

Ensure that all key-value pairs are **correctly translated** and that the **structure is maintained** as in the original.
`.trim();

// Create a readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

/**
 * Prompts the user with a question and returns the user's input as a Promise.
 * @param query - The question to ask the user.
 * @returns A Promise that resolves with the user's input.
 */
function askQuestion(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Translate Text Params type.
 * @property text - The text to translate.
 * @property sourceLang - The source language.
 * @property targetLang - The target language.
 */
type TranslateTextParams = {
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
}

/**
 * Translate the text from the source language to the target language.
 * @param text - The text to translate.
 * @param sourceLanguage - The source language.
 * @param targetLanguage - The target language.
 * @returns A promise that resolves to the translated text.
 * @see https://platform.openai.com/docs/guides/text-generation
 * @see https://platform.openai.com/docs/guides/chat-completions/getting-started
 * @see
 */
async function translateText({ text, sourceLanguage, targetLanguage }: TranslateTextParams): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            // We are using the gpt-4o-mini model for this task, because it is fast, efficient and cost-effective, this has
            // higher intelligence than gpt-3.5-turbo, but is just as fast and efficient. It also has a larger context window
            // meaning we can provide larger batches of text for translation.
            // @see https://platform.openai.com/docs/guides/text-generation
            model: OPENAI_MODEL,
            // The messages array contains the conversation history between the model and the user.
            messages: [
                // The system message tells the model to what to do. In this case, we are asking the model to translate the text,
                // and we are providing the source and target languages for the translation.
                {
                    role: 'system',
                    content: TRANSLATE_PROMPT(sourceLanguage, targetLanguage),
                },
                // The user message is the input text that we want to translate, in this case,
                // it is the extracted subtitles from the SRT file.
                {
                    role: 'user',
                    content: text,
                }
            ],
            // JSON Mode - This will ensure that the response is a valid JSON object.
            // *** It is important to always inform the model that we are expecting a valid JSON object as the response. ***
            // @see https://platform.openai.com/docs/guides/json-mode
            response_format: {
                type: 'json_object',
            },
            // The temperature parameter controls the randomness of the completions.
            // Lower values make the completions more deterministic and higher values make them more diverse.
            // Since we are translating text, we want to keep the temperature at 0 to ensure that the translation is accurate,
            // and reproducible. This will prevent the model from introducing any randomness in the translation.
            temperature: 0,
            // The seed parameter controls randomization, by using a fixed seed, we can ensure that the results are reproducible.
            // @see https://platform.openai.com/docs/advanced-usage/reproducible-outputs
            seed: 1234,
        })
    });

    const data: any = await response.json();

    if (data.choices.length === 0) {
        throw new Error('No response from the OpenAI API');
    }

    if (data.choices[0].message.content === undefined) {
        throw new Error('Invalid response from the OpenAI API');
    }

    if (data.choices[0].message.content.startsWith('Error:')) {
        throw new Error(data.choices[0].message.content);
    }

    return data.choices[0].message.content;
}

/**
 * Text type.
 * @property id - The ID of the text.
 * @property text - The text content.
 */
type Text = {
    id: string,
    text: string,
};

/**
 * Splits an array into smaller batches of the specified size.
 * @param array - The array to split.
 * @param batchSize - The size of each batch.
 * @returns An array of batches.
 */
function splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    // Create an array to store the batches
    const batches = [];

    // Loop through the array and split it into batches of the specified size
    for (let i = 0; i < array.length; i += batchSize) {
        batches.push(array.slice(i, i + batchSize));
    }

    // Return the array of batches
    return batches;
}

/**
 * Converts an array of Text objects to an object with the ID as the key.
 * @param array - The array of Text objects.
 * @returns An object with the ID as the key.
 */
function convertArrayToObject(array: Text[]): { [key: string]: string } {
    // Create an object to store the key-value pairs
    const obj: { [key: string]: string } = {};

    // Loop through the array and add each item to the object
    for (const item of array) {
        obj[item.id] = item.text;
    }

    // Return the object
    return obj;
}

/**
 * Converts an object with key-value pairs to an array of Text objects.
 * @param obj - The object with key-value pairs.
 * @returns An array of Text objects.
 */
function convertObjectToArray(obj: { [key: string]: string }): Text[] {
    // Create an array to store the Text objects
    const array: Text[] = [];

    // Loop through the object and convert each key-value pair to a Text object
    for (const key in obj) {
        array.push({ id: key, text: obj[key] });
    }

    // Return the array
    return array;
}

/**
 * Formats a duration in seconds as hh:mm:ss.
 * @param seconds - The duration in seconds.
 * @returns The formatted duration as hh:mm:ss.
 */
function formatDuration(seconds: number): string {
    // Calculate the hours
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    // Calculate the minutes
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    // Calculate the seconds
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    // Return the formatted duration as hh:mm:ss
    return `${hours}:${minutes}:${secs}`;
}

// Main function to translate SRT file captions.
try {
    // Ask the user for input file path
    const inputFile = await askQuestion('📂 Enter the path to the input SRT file: ');
    if (!fs.existsSync(inputFile)) {
        throw new Error('Input file with filename "' + inputFile + '" does not exist. Make sure to provide the correct path.');
    }

    // Ask the user for output file path
    const outputFile = await askQuestion('💾 Enter the path to save the output SRT file: ');
    if (fs.existsSync(outputFile)) {
        throw new Error('Output file with filename "' + outputFile + '" already exists. Please provide a different path.');
    }

    // Ask the user for the source language
    const sourceLang = await askQuestion(`💬 Enter the source language (default ${DEFAULT_SOURCE_LANG}): `) || DEFAULT_SOURCE_LANG;
    if (!sourceLang) {
        throw new Error('Source language is required.');
    }

    // Ask the user for the target language
    const targetLang = await askQuestion(`💬 Enter the target language (default ${DEFAULT_TARGET_LANG}): `) || DEFAULT_TARGET_LANG;
    if (!targetLang) {
        throw new Error('Target language is required.');
    }

    // Ask the user for the batch size (optional)
    const batchSize = parseInt(await askQuestion(`📦 Enter the batch size (default ${DEFAULT_BATCH_SIZE}): `), 10) || DEFAULT_BATCH_SIZE;
    if (batchSize <= 0) {
        throw new Error('Batch size must be a positive number.');
    }
    if (batchSize > MAX_BATCH_SIZE) {
        throw new Error(`Batch size exceeds the maximum limit of ${MAX_BATCH_SIZE}. Please provide a smaller batch size.`);
    }

    // Start the timer to measure the execution time
    const startTime = Date.now();

    // Create a new SrtParser instance
    const parser = new SrtParser();

    // Progress messages
    console.log('🟡 Parsing SRT captions...');

    // Parse the SRT file and extract the captions
    const captions = parser.fromSrt(fs.readFileSync(inputFile, 'utf-8'));

    // Map the captions to an array of texts
    const texts: Text[] = captions.map((caption) => ({
        id: caption.id,
        text: caption.text,
    }));

    // Split the texts into batches
    const batches = splitIntoBatches(texts, batchSize);

    // Progress message
    console.log(`🟡 Translating SRT captions in ${batches.length} batch(es)...`);

    // Translate each batch and collect the results
    const translatedTexts: Text[] = [];
    for (const [index, batch] of batches.entries()) {
        // Progress message
        console.log(`🟠 Translating batch ${index + 1}/${batches.length}...`);

        // Translate the batch of texts
        const batchResult = convertObjectToArray(JSON.parse(await translateText({
            text: JSON.stringify(convertArrayToObject(batch)),
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
        })));

        // Add the translated texts to the array
        translatedTexts.push(...batchResult);

        // Get a list of missing translations (if any)
        let missingTranslations = batch.filter((text) => !batchResult.find((t) => t.id === text.id));

        // Retry missing translations until all are translated
        while (missingTranslations.length > 0) {
            // Progress message
            console.log(`🟣 Retrying missing translations for batch ${index + 1}/${batches.length}...`);

            // Retry the missing translations
            const retryResult = convertObjectToArray(JSON.parse(await translateText({
                text: JSON.stringify(convertArrayToObject(missingTranslations)),
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
            })));

            // Add the retried translations to the array
            translatedTexts.push(...retryResult);

            // Update the missing translations
            missingTranslations = missingTranslations.filter((text) => !retryResult.find((t) => t.id === text.id));
        }
    }

    // Map the translated texts back to the captions and update the captions with the translated text
    const translatedCaptions = captions.map((caption) => {
        // Find the translated caption text by ID
        const translatedCaption = translatedTexts.find((text: Text) => text.id === caption.id);

        // Throw an error if the translation is not found (** Should not happen!! **)
        if (!translatedCaption) {
            throw new Error(`Translation not found for caption ${caption.id}`);
        }

        // Return the updated caption with the translated text
        return {
            id: caption.id,
            startTime: caption.startTime,
            startSeconds: caption.startSeconds,
            endTime: caption.endTime,
            endSeconds: caption.endSeconds,
            text: translatedCaption?.text ?? caption.text,
        };
    });

    // Progress message
    console.log('🟢 Saving the translated SRT..');

    // Save the translated SRT file
    fs.writeFileSync(outputFile, parser.toSrt(translatedCaptions));

    // Success message
    console.log(`🟢 Finished translating in ${formatDuration((Date.now() - startTime) / 1000)}`);
}
catch (error: any) {
    // Log and display any errors
    console.error('🔴 ' + error.message);
}
finally {
    // Close the readline interface
    rl.close();
}
