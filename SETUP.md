# Setup Guide for AI Quote Generator

## Prerequisites
1. You need an OpenAI API key to generate quotes
2. Get your API key from: https://platform.openai.com/api-keys

## Environment Setup

1. Create a `.env.local` file in the root of your project (same level as `package.json`)

2. Add your OpenAI API key to the file:
```
OPENAI_API_KEY=your_actual_api_key_here
```

3. Replace `your_actual_api_key_here` with your real OpenAI API key

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

4. Navigate to the "Quote Generator" tab and click "Generate Quote"

## Troubleshooting

- If you see "OpenAI API key not set" error, make sure your `.env.local` file exists and contains the correct API key
- If you see API errors, check that your OpenAI API key is valid and has sufficient credits
- Check the browser console and server logs for detailed error messages

## File Structure
- `pages/api/generate-quote.js` - API endpoint for generating quotes
- `src/app/page.js` - Main application with quote generator UI
- `.env.local` - Environment variables (create this file) 