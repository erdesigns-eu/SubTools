import type { SRTTranslateCaption, SRTTranslateMethod } from '../lib/srtTranslator.ts';

/**
 * OpenAI Model Type
 * @property gpt-4o-mini - GPT-4 Omni Model Mini
 * @property gpt-4o - GPT-4 Omni Model Full
 * @property o1-mini - OpenAI Reasoning Model Mini
 * @property o1-preview - OpenAI Reasoning Model Full
 */
const openAIModels = ['gpt-4o-mini', 'gpt-4o', 'o1-mini', 'o1-preview'] as const;
type OpenAIModel = typeof openAIModels[number];

/**
 * OpenAI API Key Type
 * @example 'sk-1234567890abcdef1234567890abcdef'
 */
type OpenAIApiKey = string;

/**
 * OpenAI Translate Prompt Type
 * @param sourceLanguage - The source language.
 * @param targetLanguage - The target language.
 */
type OpenAITranslatePrompt = (sourceLanguage: string, targetLanguage: string) => string;

/**
 * Prompt to translate the JSON values from the source language to the target language.
 * @param sourceLanguage - The source language.
 * @param targetLanguage - The target language.
 * @returns The prompt to translate the JSON values.
 */
const TRANSLATE_PROMPT: OpenAITranslatePrompt = (sourceLanguage: string, targetLanguage: string) => `
Translate the following JSON values from ${sourceLanguage} to ${targetLanguage}. 

- Only translate the **values** of the JSON object. **Do not modify, remove, or change any keys or the structure**.
- Ensure that the **exact structure** of the original JSON is preserved.
- For each key, provide the translated value. **Do not omit any key-value pairs**, even if a value is empty or seems irrelevant.
- The output should only contain the translated JSON object, without any extra explanations or text.
- The translated JSON object must be **valid JSON**. Ensure that **all keys remain the same**, and **no keys are missing or added**.
- If any value is empty or not translatable, leave it as is (do not remove the key), and simply provide the original value as is.
- Use the context from the surrounding subtitles (the text before and after) to ensure the translation is accurate and coherent. Maintain the appropriate tone and flow between subtitles, considering the context provided.
- If a subtitle contains cultural references, idioms, or phrases that do not directly translate, adapt the translation to convey the correct meaning while preserving the tone and intent.
- Correct any **grammatical or spelling errors** in the original subtitle text. Ensure that the translated text is grammatically correct, properly spelled, and follows standard language conventions.

Ensure that all key-value pairs are **correctly translated**, that the **structure is maintained** as in the original, and that translations remain accurate within the surrounding context.
`.trim();

/**
 * OpenAI Parameters Type
 * @param apiKey - OpenAI API Key.
 * @param model - OpenAI Model.
 * @param temperature - Model Temperature.
 * @param seed - Model Seed.
 * @param prompt - Model Translate Prompt.
 */
type SRTOpenAIParams = {
    apiKey: OpenAIApiKey;
    model: OpenAIModel;
    temperature?: number;
    seed?: number;
    prompt?: OpenAITranslatePrompt;
}

/**
 * Class for translating SRT captions using OpenAI Completions API
 * @class SRTOpenAI
 */
class SRTOpenAI {
    /**
     * OpenAI API Key for Authorization
     * @type {OpenAIApiKey}
     */
    private apiKey: OpenAIApiKey;

    /**
     * OpenAI Model for Translation
     * @type {OpenAIModel}
     */
    private model: OpenAIModel;

    /**
     * Model Temperature for Randomness
     * @type {number}
     */
    private temperature: number = 0;

    /**
     * Model Seed for Reproducibility
     * @type {number}
     */
    private seed: number = 1234;

    /**
     * OpenAI Translate Prompt
     * @type {OpenAITranslatePrompt}
     */
    private prompt: OpenAITranslatePrompt;

    /**
     * Constructor for SRTOpenAI Class.
     * @param {OpenAIApiKey} apiKey - OpenAI API Key
     * @param {OpenAIModel} model - OpenAI Model
     */
    constructor(params: SRTOpenAIParams) {
        // Check if the API Key is provided
        if (!params.apiKey) {
            throw new Error('OpenAI API Key is required');
        }
        // Check if the Model is provided
        if (!params.model) {
            throw new Error('OpenAI Model is required');
        }

        // Set the apiKey and model from the parameters
        this.apiKey = params.apiKey;
        this.model = params.model;

        // Check if the Temperature is provided
        if (params.temperature) {
            this.temperature = params.temperature;
        }
        // Check if the Seed is provided
        if (params.seed) {
            this.seed = params.seed
        }

        // Check if the Translate Prompt is provided
        if (params.prompt) {
            this.prompt = params.prompt;
        }
        else {
            this.prompt = TRANSLATE_PROMPT;
        }
    }

    /**
     * Convert an array of SRTTranslateCaption objects to an object with the ID as the key.
     * @param array - The array of SRTTranslateCaption objects.
     * @returns An object with the ID as the key.
     */
    private convertArrayToObject(array: SRTTranslateCaption[]): { [key: string]: string } {
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
     * Convert an object with key-value pairs to an array of SRTTranslateCaption objects.
     * @param obj - The object with key-value pairs.
     * @returns An array of SRTTranslateCaption objects.
     */
    private convertObjectToArray(obj: { [key: string]: string }): SRTTranslateCaption[] {
        // Create an array to store the SRTTranslateCaption objects
        const array: SRTTranslateCaption[] = [];

        // Loop through the object and convert each key-value pair to a SRTTranslateCaption object
        for (const key in obj) {
            array.push({ id: key, text: obj[key] });
        }

        // Return the array
        return array;
    }

    /**
     * Translate an array of SRTTranslateCaption objects from the source language to the target language.
     * @param captions - The array of SRTTranslateCaption objects to translate.
     * @param sourceLanguage - The source language of the captions.
     * @param targetLanguage - The target language for the translation.
     * @returns A Promise that resolves to the translated array of SRTTranslateCaption objects.
     */
    public translate: SRTTranslateMethod = async (captions: SRTTranslateCaption[], sourceLanguage: string, targetLanguage: string): Promise<SRTTranslateCaption[]> => {
        // Convert the array of SRTTranslateCaption objects to an object with the ID as the key
        // because we are using 'json_object' response format in the OpenAI API request, we need
        // to provide the data in the form of an object instead of an array.
        const sourceData = this.convertArrayToObject(captions);

        // Request the translation from the OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                // The model parameter specifies the model to use for the completion.
                model: this.model,
                // The messages array contains the conversation history between the model and the user.
                messages: [
                    // The system message tells the model to what to do. In this case, we are asking the model to translate the text,
                    // and we are providing the source and target languages for the translation.
                    {
                        role: 'system',
                        content: this.prompt(sourceLanguage, targetLanguage),
                    },
                    // The user message is the input text that we want to translate, in this case,
                    // it is the extracted subtitles from the SRT file.
                    {
                        role: 'user',
                        content: JSON.stringify(sourceData),
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
                temperature: this.temperature,
                // The seed parameter controls randomization, by using a fixed seed, we can ensure that the results are reproducible.
                // @see https://platform.openai.com/docs/advanced-usage/reproducible-outputs
                seed: this.seed,
            })
        });
    
        // Parse the response from the OpenAI API
        const data = await response.json();
    
        // Check if the response contains any errors
        if (data.choices.length === 0) {
            throw new Error('No response from the OpenAI API');
        }
        // Check if the response contains the translated JSON object
        if (data.choices[0].message.content === undefined) {
            throw new Error('Invalid response from the OpenAI API');
        }
        // Check if the response contains an error message
        if (data.choices[0].message.content.startsWith('Error:')) {
            throw new Error(data.choices[0].message.content);
        }

        // Parse the translated JSON object from the response
        const targetData = JSON.parse(data.choices[0].message.content);
    
        // Convert the translated JSON object to an array of SRTTranslateCaption objects
        return this.convertObjectToArray(targetData);
    }
}

export default SRTOpenAI;
export { openAIModels };
export type { OpenAIModel, OpenAIApiKey, OpenAITranslatePrompt, SRTOpenAIParams };