# Subtitle Translation Script

This script allows you to translate subtitle text (in the SRT format) from one language to another using OpenAI's GPT models. It reads subtitles from an SRT file, splits the text into manageable batches, and uses the OpenAI API to translate the text, maintaining the original structure and formatting.

## Features

- Translates subtitle text from one language to another.
- Uses OpenAI's GPT models for translation.
- Supports batch processing for efficient translation.
- Handles SRT subtitle files.

## Prerequisites

Before using this script, ensure you have the following:

- **Node.js** installed on your system. If you don't have it, download it from [nodejs.org](https://nodejs.org/).
- **NPM Package Manager*** installed on your system. Normally this is installed with Node.js
- **OpenAI API key**. You can obtain this by signing up on the [OpenAI platform](https://platform.openai.com/signup).

## Installation

### 1. Install Dependencies

Install the required Node.js dependencies:

```bash
npm install
```

### 2. Setup OpenAI API Key

In the script file (`index.ts`), you need to replace the `OPENAI_API_KEY` placeholder with your actual OpenAI API key.

```typescript
const OPENAI_API_KEY = 'your_openai_api_key';
```

### 3. Configure Script Options

The script includes several configurable options, which you can modify directly in the source code:

- **`OPENAI_API_KEY`**: Replace `'your_openai_api_key'` with your actual API key.
- **`OPENAI_MODEL`**: Change the OpenAI model used (e.g., `'gpt-4o-mini'`).
- **`DEFAULT_BATCH_SIZE`**: Set the default batch size for translations (default is 250).
- **`MAX_BATCH_SIZE`**: Adjust the maximum batch size for translations (default is 1000).
- **`DEFAULT_SOURCE_LANG`**: Specify the default source language (default is `'en'`).
- **`DEFAULT_TARGET_LANG`**: Specify the default target language (default is `'nl'`).

### Usage

1. **Run the Script**

   Use NPM to execute the script:

   ```bash
   npm start
   ```

2. **Input Files**

   The script expects an input SRT file containing subtitles. It will prompt you to provide:
   - The source language.
   - The target language.
   - The desired batch size for translation.

3. **Output**

   The script will prompt you to provide a path/filename for the output SRT file.

4. **Translation Process**

   The script:
   - Parses the SRT file into captions.
   - Splits the captions into batches based on your batch size.
   - Sends each batch to the OpenAI API for translation.
   - Writes the translated captions back to a new SRT file.

### Notes
- Ensure that the input SRT file is properly formatted to avoid errors.
- The script requires an active internet connection to communicate with the OpenAI API.

### Model
- The default model is `gpt-4o-mini` because it is fast and cheap, but the model might need some retries in order to translate all the captions.
- You can change the model to `gpt-4o` or `o1-preview` or `o1-mini`, these models are more expensive but might have better accuracy or better translations.

### About the Author

This script was developed by Ernst Reidinga (ERDesigns). 

I am a passionate software engineer committed to creating efficient tools for automation and language processing. If you have suggestions, encounter issues, or want to contribute, feel free to reach out or open a pull request on the project's repository.

### License

This project is licensed as **Freeware Open-Source**. You are free to use, modify, and distribute the script, provided proper attribution is given to the original author. While the software is provided as-is without any warranties, contributions and improvements are always welcome.
