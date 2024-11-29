import header, { askQuestion, createValidator, closeRL, clearTerminal } from './lib/common.js';
import single from './modes/single.js';
import multi from './modes/multi.js';
import settings from './modes/settings.js';

/**
 * Print the header to the console.
 * @returns {void} Nothing
 */
function printHeader(): void {
    // Print the header to the console  
    clearTerminal(header);
    // Print a newline
    console.log();
    // Print the author's name
    console.log('Author...: Ernst Reidinga - ERDesigns');
    // Print the version of the application
    console.log('Version..: 1.0.0');
    // Print a newline
    console.log();
}

/**
 * Main function of the application.
 * @returns {Promise<void>} A Promise that resolves when the function has completed.
 */
async function main(): Promise<void> {
    // Print the header
    printHeader();

    try {
        // Error message for invalid input
        const errorMessage = '🔴 Invalid mode selected. Please select either "Single", "Multi", "Settings" or "Help".';
        // Validator function
        const validator = createValidator(['single', 'multi', 'settings', 'help']);
        // Ask the user what mode they want to use
        const mode = await askQuestion('🟣 Select a mode (Single/Multi/Settings/Help): ', validator, errorMessage);
        switch (mode.toLowerCase()) {
            case 'single':
            case '1':
                await single();
                break;
            case 'multi':
            case '2':
                await multi();
                break;
            case 'settings':
            case '3':
                await settings();
                break;
            case 'help':
            case '4':
            default:
                console.log('🟣 1. Single   - Process a single subtitle or video file.');
                console.log('🟣 2. Multi    - Process multiple subtitles or video files.');
                console.log('🟣 3. Settings - Change the application settings.');
                console.log('🟣 4. Help     - Show this help message.');
                break;
        }
    }
    catch (error: any) {
        console.error(`🔴 ${error.message ?? error}`);
    }
    finally {
        closeRL();
    }
}

// Call the main function
await main();
