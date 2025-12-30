# Setting Up Google Gemini API (Free)

## Get Your Free Gemini API Key

## Get Your Free Gemini API Key

1. **Visit Google AI Studio**: https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Copy the API key** that's generated

## Add API Key to Your Project

1. Open `backend/.env` file
2. Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Save the file
4. **Restart your backend server** for changes to take effect

## Install Dependencies

After switching to Gemini, you need to install the new package:

```bash
cd backend
npm install @google/generative-ai
```

This will automatically remove the old `openai` package and install the Gemini package.

## Benefits of Gemini API

- ✅ **Free tier available** - No credit card required
- ✅ **Generous free quota** - 60 requests per minute for gemini-1.5-flash
- ✅ **High quality responses** - Comparable to ChatGPT
- ✅ **No billing setup needed** - Just get the API key and use it
- ✅ **Fast responses** - Using gemini-1.5-flash model for quick generation

## Available Models

The project uses `gemini-1.5-flash` which is:
- Free to use (generous free tier)
- Fast and efficient
- Great for generating educational content

If you want more capable responses, you can change the model in `backend/routes/content.js` from `gemini-1.5-flash` to `gemini-1.5-pro` (may have different quota limits).

## Troubleshooting

- **"API key not configured"**: Make sure you've added `GEMINI_API_KEY` to your `.env` file and restarted the server
- **"Invalid API key"**: Double-check that you copied the full API key correctly
- **Rate limit errors**: The free tier has rate limits, but they're quite generous (60 requests/minute)

