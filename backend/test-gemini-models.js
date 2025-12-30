// Quick script to test which Gemini models are available with your API key
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const defaultModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const modelsToTest = [
  defaultModel,
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro'
];

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say "Hello" in JSON format: {"message": "Hello"}');
    const response = await result.response;
    const text = response.text();
    console.log(`✅ ${modelName} - WORKS! Response: ${text.substring(0, 50)}...`);
    return true;
  } catch (error) {
    // Give user a helpful hint when model can't be found and log full error details
    console.log(`❌ ${modelName} - FAILED: ${error?.message || error}`);
    // Print the whole error for debugging (stack, properties)
    console.error('Full error object:', error);
    if (error?.status) console.error('Status:', error.status);
    if (error?.code) console.error('Code:', error.code);

    // If the SDK provides a response object, try to read its body for more details
    if (error?.response) {
      try {
        // Some SDK errors expose a text() method on response
        if (typeof error.response.text === 'function') {
          const bodyText = await error.response.text();
          console.error('Response body text:', bodyText);
        } else {
          console.error('Error response (raw):', error.response);
        }
      } catch (e) {
        console.error('Failed to read error.response body:', e);
      }
    }

    if (error.message && (error.message.includes('model') || error.message.includes('404') || error.message.includes('not found') || error.message.includes('not available'))) {
      console.log('Hint: The model name may not be available for your API key. Try using one of:\n  - gemini-1.5-flash\n  - gemini-1.5-pro\n  - gemini-1.0-pro\nOr set GEMINI_MODEL in backend/.env to the model you have access to.');
    }

    return false;
  }
}

async function testAllModels() {
  console.log('Testing available Gemini models...\n');
  
  for (const modelName of modelsToTest) {
    await testModel(modelName);
    console.log(''); // Empty line for readability
  }
  
  console.log('Test complete! Use the model name that works in your code.');
}

testAllModels().catch(console.error);

