import EventEmitter from 'events';
import { formatDuration } from './common.js';
import type { SRTCaption } from './srtParser.js';

/**
 * Parameters for configuring the SRTTranslate class.
 * @property batchSize - The batch size for splitting the captions array into smaller chunks.
 * @property concurrentRequests - The maximum number of concurrent requests to make to the API.
 * @property sourceLanguage - The source language of the captions to translate from.
 * @property targetLanguage - The target language of the captions to translate to.
 * @property translateMethod - The method to use for translating captions.
 */
type SRTTranslatorParams = {
    batchSize?: number;
    concurrentRequests?: number;
    sourceLanguage?: string;
    targetLanguage?: string;
    translateMethod: SRTTranslateMethod;
};

/**
 * SRT Translate Caption.
 * @property id - The ID of the caption.
 * @property text - The text of the caption.
 */
type SRTTranslateCaption = Pick<SRTCaption, 'id' | 'text'>;

/**
 * SRT Translate Method.
 * @param captions - The captions to translate.
 * @param sourceLanguage - The source language of the captions.
 * @param targetLanguage - The target language of the captions.
 * @returns A promise that resolves with the translated captions.
 */
type SRTTranslateMethod = (captions: SRTTranslateCaption[], sourceLanguage: string, targetLanguage: string) => Promise<SRTTranslateCaption[]>;

/**
 * Default batch size.
 * @type {number} defaultBatchSize
 * @default 500
 */
const defaultBatchSize: number = 500;

/**
 * Default maximum number of concurrent requests.
 * @type {number} defaultConcurrentRequests
 * @default 10
 */
const defaultConcurrentRequests: number = 10;

/**
 * Default source language.
 * @type {string} defaultSourceLanguage
 * @default 'en'
 */
const defaultSourceLanguage: string = 'en';

/**
 * Default target language.
 * @type {string} defaultTargetLanguage
 * @default 'nl'
 */
const defaultTargetLanguage: string = 'nl';

/**
 * Class for translating SRT captions from one language to another.
 * @class SRTTranslator
 */
class SRTTranslator extends EventEmitter {
    /**
     * Batch size for splitting the captions array into smaller chunks.
     * @type {number} batchSize
     */
    private batchSize: number;

    /**
     * Maximum number of concurrent requests to make to the API used for translation.
     * @type {number} concurrentRequests
     */
    private concurrentRequests: number;

    /**
     * The source language of the captions to translate from.
     * @type {string} sourceLanguage
     */
    private sourceLanguage: string;

    /**
     * The target language of the captions to translate to.
     * @type {string} targetLanguage
     */
    private targetLanguage: string;

    /**
     * The method to use for translating captions.
     * @type {SRTTranslateMethod} translateMethod
     */
    private translateMethod: SRTTranslateMethod;

    /**
     * Constructor for the SRTTranslator class.
     * @param {SRTTranslatorParams} params - Parameters for configuring the SRTTranslator class.
     * @emits start - Emitted when the translation process starts.
     * @emits finish - Emitted when the translation process finishes.
     * @emits error - Emitted when an error occurs during the translation process.
     */
    constructor(params: SRTTranslatorParams) {
        // Call the parent constructor
        super(); 

        // Set the parameters for the SRTTranslator class
        this.batchSize = params.batchSize ?? defaultBatchSize;
        this.concurrentRequests = params.concurrentRequests ?? defaultConcurrentRequests;
        this.sourceLanguage = params.sourceLanguage ?? defaultSourceLanguage;
        this.targetLanguage = params.targetLanguage ?? defaultTargetLanguage;
        this.translateMethod = params.translateMethod;
    }

    /**
     * Splits the captions array into batches of the specified size.
     * @param {SRTTranslateCaption[]} captions - The captions to split into batches.
     * @returns {SRTTranslateCaption[][]} An array of caption batches.
     */
    private splitIntoBatches(array: SRTTranslateCaption[], batchSize: number): SRTTranslateCaption[][] {
        // Create an array to store the batches
        const batches: SRTTranslateCaption[][] = [];
    
        // Loop through the array and split it into batches of the specified size
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
    
        // Return the array of batches
        return batches;
    }

    /**
     * Limits the number of concurrent promises that are executed at the same time.
     * @param promises - An array of promise functions to execute.
     * @returns A promise that resolves with the results of the promises.
     */
    private async limitConcurrentPromises(promises: (() => Promise<SRTTranslateCaption[]>)[]): Promise<SRTTranslateCaption[]> {
        const results: SRTTranslateCaption[] = [];
        const executing: Set<Promise<void>> = new Set();
    
        // Function to enqueue promises while respecting the concurrency limit
        const enqueue = async (p: () => Promise<SRTTranslateCaption[]>) => {
            const promise = p().then((result) => {
                results.push(...result); // Collect the results when resolved
            });
    
            // Add the promise to the executing set
            executing.add(promise);
    
            // If we reach the max concurrency, wait for one of the promises to settle before starting the next
            if (executing.size >= this.concurrentRequests) {
                await Promise.race(executing);
            }
    
            // Once the promise settles, remove it from the executing set
            promise.finally(() => executing.delete(promise));
        };
    
        // Enqueue all promises
        for (const promise of promises) {
            await enqueue(promise);
        }
    
        // Wait for all remaining promises to finish
        await Promise.all(executing);
    
        // Return the results of the promises
        return results;
    }
    
    /**
     * Translates a batch of captions from the source language to the target language.
     * @param {SRTTranslateCaption[]} captions - The captions to translate.
     * @returns {Promise<SRTTranslateCaption[]>} A promise that resolves with the translated captions.
     */
    private async translateBatch(captions: SRTTranslateCaption[]): Promise<SRTTranslateCaption[]> {
        // Translate the captions using the specified translate method
        let translatedCaptions = await this.translateMethod(captions, this.sourceLanguage, this.targetLanguage);
        // Filter out the captions that were not translated successfully
        let missingTranslations = captions.filter((caption) => translatedCaptions.find((c) => c.id === caption.id) === undefined);

        // Retry translating the missing captions until all are translated
        while (missingTranslations.length > 0) {
            // Retry translating the missing captions
            const retriedCaptions = await this.translateMethod(missingTranslations, this.sourceLanguage, this.targetLanguage);
            // Add the successfully translated captions to the translated captions array
            translatedCaptions = [...translatedCaptions, ...retriedCaptions];
            // Filter out the captions that were not translated successfully again
            missingTranslations = captions.filter((caption) => translatedCaptions.find((c) => c.id === caption.id) === undefined);
        }

        // Return the translated captions
        return translatedCaptions;
    }

    /**
     * Translate the captions from the source language to the target language.
     * @param captions - The captions to translate.
     * @returns A promise that resolves with the translated captions.
     */
    public async translate(captions: SRTCaption[]): Promise<SRTCaption[]> {
        // First map the captions to the SRTTranslateCaption type
        const translateCaptions: SRTTranslateCaption[] = captions.map(caption => ({
            id: caption.id,
            text: caption.text
        }));

        // Split the captions into batches of the specified size
        const batches = this.splitIntoBatches(translateCaptions, this.batchSize);
        
        // Start time for measuring the translation duration
        const startTime = Date.now();

        // Emit a 'start' event
        this.emit('start', {
            captions: captions.length,
            batches: batches.length,
        });

        // Translate each batch of captions in parallel with a maximum number of concurrent requests
        const translatedBatches = await this.limitConcurrentPromises(batches.map((batch: SRTTranslateCaption[]) => () => this.translateBatch(batch)));

        // Emit a 'finish' event with the duration of the translation
        this.emit('finish', {
            durationMs: Date.now() - startTime,
            durationFormatted: formatDuration((Date.now() - startTime) / 1000),
        });

        // Flatten the array of translated batches back into a single array
        const translatedCaptions = translatedBatches.flat();

        // Map the translated captions back to the SRTCaption type
        return captions.map((caption: SRTCaption) => {
            // Find the translated caption with the same ID as the current caption
            const translatedCaption = translatedCaptions.find((tc: SRTTranslateCaption) => tc.id === caption.id);

            // If no translated caption was found, emit an error (** This should not happen **)
            if (!translatedCaption) {
                this.emit('error', `Could not find translated caption for ID: ${caption.id}`);
            }

            // Return the original caption with the translated text, 
            // or the original text if no translation was found.
            return {
                ...caption,
                text: translatedCaption?.text ?? caption.text,
            };
        });
    }
}

export default SRTTranslator;
export type { SRTTranslatorParams, SRTTranslateCaption, SRTTranslateMethod };