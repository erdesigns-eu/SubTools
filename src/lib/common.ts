import readline from 'readline';
import fs from 'fs';

/**
 * Header for the application that is displayed in the console.
 * @type {string} header
 */
export default `
███████╗██╗   ██╗██████╗ ████████╗ ██████╗  ██████╗ ██╗     ███████╗
██╔════╝██║   ██║██╔══██╗╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
███████╗██║   ██║██████╔╝   ██║   ██║   ██║██║   ██║██║     ███████╗
╚════██║██║   ██║██╔══██╗   ██║   ██║   ██║██║   ██║██║     ╚════██║
███████║╚██████╔╝██████╔╝   ██║   ╚██████╔╝╚██████╔╝███████╗███████║
╚══════╝ ╚═════╝ ╚═════╝    ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
`.trim();

/**
 * The name of the settings file.
 * @type {string}
 */
const settingsFilename: string = 'settings.json';

// Create a readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

/**
 * Prompts the user with a question and returns the user's input as a Promise.
 * @param query - The question to ask the user.
 * @param validator - The validator function.
 * @param errorMessage - The error message to show when the input is invalid.
 * @returns A Promise that resolves with the user's input.
 */
export function askQuestion(query: string, validator?: (answer: string) => boolean, errorMessage?: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            if (validator && !validator(answer)) {
                // Display a message if provided
                if (errorMessage) {
                    console.log(errorMessage);
                }
                // Re-run the question
                resolve(askQuestion(query, validator, errorMessage));
            } 
            else {
                resolve(answer);
            }
        });
    });
}

/**
 * Close the readline interface
 * @returns {void} Nothing
 */
export function closeRL(): void {
    rl.close();
}

/**
 * Create a validator function for the askQuestion function 
 * @param validNumbers - Valid numbers
 * @param validStrings - Valid strings
 * @returns The validator function
 */
export function createValidator(validNumbers: number[], validStrings: string[]): (answer: string) => boolean {
    return (answer: string) => {
        return validNumbers.map((n) => `${n}`).includes(answer.toLowerCase()) || validStrings.includes(answer.toLowerCase());
    }
}

/**
 * Read a file from disk.
 * @param {string} filename - The name of the file to read.
 * @returns {Promise<string>} The contents of the file as a string.
 */
export async function readFile(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (error, data) => {
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
 * Write a file to disk.
 * @param {string} filename - The name of the file to write.
 * @param {string} data - The data to write to the file.
 * @returns {Promise<void>} Nothing
 */
export async function writeFile(filename: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, 'utf8', (error) => {
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
 * Read settings from a file.
 * @returns {Promise<Record<string, any>>} The settings as a JSON object.
 */
export async function readSettings(): Promise<Record<string, any>> {
    return readFile(settingsFilename).then((data) => JSON.parse(data)).catch(() => ({}));
}

/**
 * Read settings from a file.
 * @param data - The data to write to the file.
 * @returns {Promise<Record<string, any>>} The settings as a JSON object.
 */
export async function writeSettings(data: Record<string, any>): Promise<void> {
    return writeFile(settingsFilename, JSON.stringify(data, null, 4));
}

/**
 * Clear the terminal screen.
 * @returns {void} Nothing
 */
export function clearTerminal(text: string): void {
    console.clear();
    console.log(text);
}

/**
 * Get the translator from the settings.
 * @returns {Promise<string>} The translator.
 */
export async function getTranslator(): Promise<string> {
    const storedSettings = await readSettings();
    return storedSettings.translator ?? 'openai';
}

/**
 * Get the batch size from the settings.
 * @returns {Promise<number>} The batch size.
 */
export async function getBatchSize(): Promise<number> {
    const storedSettings = await readSettings();
    return parseInt(storedSettings.batchSize, 10) ?? 10;
}

/**
 * Get the number of concurrent requests from the settings.
 * @returns {Promise<number>} The number of concurrent requests.
 */
export async function getConcurrentRequests(): Promise<number> {
    const storedSettings = await readSettings();
    return parseInt(storedSettings.concurrentRequests, 10) ?? 5;
}

/**
 * Get the translator settings.
 * @param {string} translator - The name of the translator.
 * @returns {Promise<Record<string, any>>} The translator settings.
 */
export async function getTranslatorSettings(translator: string): Promise<Record<string, any>> {
    const storedSettings = await readSettings();
    return storedSettings[translator.replace(' ', '')] ?? {};
}

/**
 * Format a duration in seconds to hh:mm:ss.
 * @param seconds - The duration in seconds.
 * @returns {string} The formatted duration as hh:mm:ss.
 */
export function formatDuration(seconds: number): string {
    // Calculate the hours
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    // Calculate the minutes
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    // Calculate the seconds
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    
    // Return the formatted duration as hh:mm:ss
    return `${hours}:${minutes}:${secs}`;
}