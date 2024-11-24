import os from 'os';

/**
 * Represents a single SRT caption line.
 * @property id - The caption ID number.
 * @property startTime - The caption start time in the format 'HH:MM:SS,mmm'.
 * @property startSeconds - The caption start time in seconds.
 * @property endTime - The caption end time in the format 'HH:MM:SS,mmm'.
 * @property endSeconds - The caption end time in seconds.
 * @property text - The caption text content.
 */
type SRTCaption = {
    id: string;
    startTime: string;
    startSeconds: number;
    endTime: string;
    endSeconds: number;
    text: string;
}

/**
 * SRT (SubRip) parser class for parsing and stringifying SRT files.
 * This class is used to parse SRT files into an array of caption objects,
 * and to convert an array of caption objects back into an SRT file string.
 * The class is designed to be compatible with different operating systems.
 * It supports both comma and period timestamps, and can handle various
 * formatting issues that may be present in SRT files.
 * @class SRTParser
 */
class SRTParser {
    /**
     * End of line character used in SRT files.
     * This is used to ensure compatibility with different operating systems.
     */
    private EOL;

    /**
     * Regular expression for matching SRT timestamps with commas.
     * Matches the following format: 'HH:MM:SS,mmm --> HH:MM:SS,mmm'.
     */
    private readonly commaRegEx = /(\d+)\n(\d{1,2}:\d{2}:\d{2},\d{1,3}) --> (\d{1,2}:\d{2}:\d{2},\d{1,3})/g;

    /**
     * Regular expression for matching SRT timestamps with periods.
     * Matches the following format: 'HH:MM:SS.mmm --> HH:MM:SS.mmm'.
     */
    private readonly dotRegEx   = /(\d+)\n(\d{1,2}:\d{2}:\d{2}\.\d{1,3}) --> (\d{1,2}:\d{2}:\d{2}\.\d{1,3})/g;

    /**
     * Creates a new instance of the SRTParser class.
     * @param EOL - The end of line character to use in the SRT file.
     * @constructor SRTParser
     * @returns A new instance of the SRTParser class.
     */
    constructor({ EOL }: { EOL: string } = { EOL: os.EOL}) {
        // Get the correct end of line character for the current operating system
        this.EOL = EOL;
    }

    /**
     * Converts an SRT timestamp to seconds.
     * @param srtTimestamp - The SRT timestamp in the format 'HH:MM:SS,mmm'.
     * @returns The timestamp converted to seconds as a float, rounded to three decimal places.
     */
    private timestampToSeconds(srtTimestamp: string): number {
        // Split the timestamp into time and milliseconds parts
        const [timePart, millisecondsPart] = srtTimestamp.split(',');
        const milliseconds = parseInt(millisecondsPart, 10);

        // Extract hours, minutes, and seconds from the time part
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        // Calculate the total seconds
        const totalSeconds = 
            (hours * 3600) +       // Convert hours to seconds
            (minutes * 60) +       // Convert minutes to seconds
            seconds +              // Add remaining seconds
            (milliseconds / 1000); // Convert milliseconds to seconds

        // Round to three decimal places to fix potential floating-point errors
        return Math.round(totalSeconds * 1000) / 1000;
    }

    /**
     * Ensures the SRT timestamp format is correct.
     * @param time - The input time string, possibly in incorrect format.
     * @returns The corrected time string in the format 'HH:MM:SS,mmm'.
     */
    private correctFormat(time: string): string {
        // Replace periods with commas to follow SRT conventions
        const formattedTime = time.replace('.', ',');

        // Split into main time part and milliseconds
        const [mainTime, msPart] = formattedTime.split(',');

        // Ensure milliseconds are exactly 3 digits
        const milliseconds = this.fixedStrDigit(3, msPart);

        // Split main time part into hours, minutes, and seconds
        const [rawHours, rawMinutes, rawSeconds] = mainTime.split(':');

        // Ensure each component is properly padded to 2 digits
        const hours = this.fixedStrDigit(2, rawHours, false);
        const minutes = this.fixedStrDigit(2, rawMinutes, false);
        const seconds = this.fixedStrDigit(2, rawSeconds, false);

        // Return the corrected timestamp
        return `${hours}:${minutes}:${seconds},${milliseconds}`;
    }

    /**
     * Adjusts a string to have a specific number of digits.
     * @param digitCount - The desired number of digits.
     * @param str - The input string to adjust.
     * @param padEnd - Whether to pad at the end (true) or the start (false).
     * @returns The adjusted string with the desired number of digits.
     */
    private fixedStrDigit(digitCount: number, str: string, padEnd: boolean = true): string {
        if (str.length === digitCount) {
            // If the string already has the desired length, return as is
            return str;
        }
        if (str.length > digitCount) {
            // If the string is too long, truncate it to the desired length
            return str.slice(0, digitCount);
        }
        // If the string is too short, pad it with zeros
        return padEnd
            ? str.padEnd(digitCount, '0')    // Pad at the end
            : str.padStart(digitCount, '0'); // Pad at the start
    }

    /**
     * Attempts to parse an SRT file with the provided regular expression.
     * @param data - The raw SRT file data as a string.
     * @param regex - The regular expression to use for parsing.
     * @returns An array of parsed SRT line objects.
     */
    private parseData(data: string, regex: RegExp): string[] {
        // Remove carriage returns from the input data
        data = data.replace(/\r/g, '');

        // Split the data using the provided regular expression
        let dataArray = data.split(regex);

        // Remove the first empty string from the array
        dataArray.shift();

        // Return the resulting array
        return dataArray;
    }

    /**
     * Parses an SRT file into an array of caption objects.
     * @param data - The raw SRT file data as a string.
     * @returns An array of parsed SRT caption objects.
     */
    public parse(data: string): SRTCaption[] {
        // Attempt to parse the data using the comma regular expression
        let dataArray = this.parseData(data, this.commaRegEx);

        // If no data was found using commas, try parsing with periods
        if (dataArray.length === 0) {
            dataArray = this.parseData(data, this.dotRegEx);
        }

        // If no data was found at all, return an empty array
        if (dataArray.length === 0) {
            return [];
        }

        // Initialize an array to store the parsed captions
        let captions: SRTCaption[] = [];
        // Iterate over the parsed data and create caption objects for each entry
        for (let i = 0; i < dataArray.length; i += 4) {
            const id = dataArray[i].trim();
            // Extract and correct the start time
            const startTime = this.correctFormat(dataArray[i + 1].trim());
            // Extract and correct the end time
            const endTime = this.correctFormat(dataArray[i + 2].trim());
            // Extract the caption text and trim any leading/trailing whitespace
            const text = dataArray[i + 3].trim();
            
            // Create and add the caption object to the array of captions.
            captions.push({
                id,
                startTime,
                startSeconds: this.timestampToSeconds(startTime),
                endTime,
                endSeconds: this.timestampToSeconds(endTime),
                text,
            });
        }

        // Return the parsed captions
        return captions;
    }

    /**
     * Converts an array of caption objects back into an SRT file string.
     * @param captions - An array of SRT caption objects.
     * @returns The SRT file data as a string.
     */
    public stringify(captions: SRTCaption[]): string {
        // Initialize the result string
        let result =  '';

        // Iterate over each caption and add it to the result string
        for (let caption of captions) {
            // Add the caption ID
            result += caption.id + this.EOL;
            // Add the caption start and end timestamps
            result += caption.startTime + ' --> ' + caption.endTime + this.EOL;
            // Add the caption text and a blank line
            result += caption.text.replace('\n', this.EOL) + this.EOL + this.EOL;
        }

        // Return the final result string
        return result;
    }
}

export default SRTParser;
export type { SRTCaption };