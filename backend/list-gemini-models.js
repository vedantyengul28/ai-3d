// List available Gemini models for your API key
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log('Attempting to use SDK to list models...');
    if (typeof genAI.listModels === 'function') {
      const res = await genAI.listModels();
      console.log('Models (SDK response):');
      console.log(JSON.stringify(res, null, 2));
      return;
    }
  } catch (e) {
    console.warn('SDK listModels failed:', e.message || e);
  }

  // Fallback: call REST ListModels endpoint directly
  try {
    console.log('Falling back to REST call to list models...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`REST list models failed ${res.status}: ${text}`);
    }
    const data = await res.json();
    console.log('Models (REST response):');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to list models:', err);
    process.exit(1);
  }
}

listModels().catch(err => {
  console.error('Error listing models:', err);
  process.exit(1);
});
