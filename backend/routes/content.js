const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { jsonrepair } = require('jsonrepair');
const Session = require('../models/Session');

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Try multiple Gemini model candidates until one succeeds
async function tryGenerateWithGemini(genPrompt) {
  const preferred = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : [];
  const initialCandidates = [...new Set([...preferred, 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'])];

  // Try initial candidates first
  for (const m of initialCandidates) {
    try {
      console.log('Trying Gemini model:', m);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent(genPrompt);
      const response = await result.response;
      const text = response.text();
      console.log(`Gemini model ${m} succeeded`);
      return text;
    } catch (err) {
      console.warn(`Gemini model ${m} failed: ${err.message}`);
    }
  }

  // If initial candidates failed, try listing available models from the provider
  console.log('Initial models failed — fetching model list from Gemini to try other models...');
  let providerModels = [];
  try {
    if (typeof genAI.listModels === 'function') {
      const res = await genAI.listModels();
      // SDK may return a nested structure — try to extract model names
      if (res && Array.isArray(res.models)) {
        providerModels = res.models.map(m => m.name || m.model || m.id).filter(Boolean);
      } else if (Array.isArray(res)) {
        providerModels = res.map(m => m.name || m.model || m.id).filter(Boolean);
      } else if (res && typeof res === 'object') {
        // attempt to extract any keys
        providerModels = Object.values(res).flatMap(v => Array.isArray(v) ? v : []).map(m => m?.name || m?.model || m?.id).filter(Boolean);
      }
    } else {
      // Fallback: call REST ListModels endpoint directly
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
      const r = await fetch(url);
      if (r.ok) {
        const json = await r.json();
        if (json && Array.isArray(json.models)) {
          providerModels = json.models.map(m => m.name || m.model || m.id).filter(Boolean);
        }
      } else {
        const text = await r.text();
        console.warn('List models REST call failed:', r.status, text);
      }
    }
  } catch (err) {
    console.warn('Failed to fetch provider model list:', err?.message || err);
  }

  // Filter out ones we've already tried and limit attempts
  providerModels = [...new Set(providerModels)].filter(m => !initialCandidates.includes(m)).slice(0, 10);
  console.log('Additional models to try:', providerModels);

  for (const m of providerModels) {
    // Try normalized variants: the provider sometimes returns names like 'models/gemini-2.5-flash'
    const normalized = (typeof m === 'string') ? m.replace(/^models\//, '') : m;
    const candidates = [...new Set([m, normalized])];

    // Skip models clearly not meant for text generation
    if (/embedding|embed|vision|image|audio|tool/i.test(m)) {
      console.log('Skipping non-text model:', m);
      continue;
    }

    for (const candidate of candidates) {
      try {
        console.log('Trying provider model candidate:', candidate);
        const model = genAI.getGenerativeModel({ model: candidate });
        const result = await model.generateContent(genPrompt);
        const response = await result.response;
        const text = response.text();
        console.log(`Gemini provider model ${candidate} succeeded`);
        return text;
      } catch (err) {
        console.warn(`Provider model candidate ${candidate} failed: ${err.message}`);
      }
    }
  }

  throw new Error('All tried Gemini models failed.');
}

// Fetch Wikipedia content and split it into chapters as a fallback when Gemini fails
async function fetchWikipediaChapters(topic) {
  if (!topic || !topic.trim()) throw new Error('No topic provided for Wikipedia fallback');

  // 1) Search for the best matching page title
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&format=json&utf8=1&srprop=`;
  const sRes = await fetch(searchUrl);
  if (!sRes.ok) throw new Error('Wikipedia search failed');
  const sJson = await sRes.json();
  const title = sJson?.query?.search?.[0]?.title;
  if (!title) throw new Error('No matching Wikipedia page found');

  // 2) Get the plain text extract for the page (includes sections)
  const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&titles=${encodeURIComponent(title)}&format=json&utf8=1&redirects=1`;
  const eRes = await fetch(extractUrl);
  if (!eRes.ok) throw new Error('Wikipedia extract fetch failed');
  const eJson = await eRes.json();
  const pages = eJson?.query?.pages;
  if (!pages) throw new Error('No page extract available');
  const page = pages[Object.keys(pages)[0]];
  const text = (page && page.extract) ? page.extract : '';
  if (!text || text.trim().length === 0) throw new Error('Empty Wikipedia page content');

  // 3) Split into paragraphs and chunk into 5 chapters (or fewer if content short)
  const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const targetChapters = Math.min(5, Math.max(1, Math.ceil(paras.length / Math.ceil(paras.length / 3))));
  const per = Math.ceil(paras.length / targetChapters) || 1;
  const chapters = [];
  for (let i = 0; i < targetChapters; i++) {
    const slice = paras.slice(i * per, (i + 1) * per);
    const content = slice.join('\n\n');
    if (content) {
      chapters.push({
        chapterNumber: chapters.length + 1,
        title: i === 0 ? `Introduction to ${title}` : `Chapter ${chapters.length + 1}`,
        content
      });
    }
  }

  // If not enough paragraph split, create at least 3 short chapters from the text
  if (chapters.length === 0 && text) {
    const words = text.split(/\s+/);
    const chunkSize = Math.ceil(words.length / 3);
    for (let i = 0; i < 3; i++) {
      const start = i * chunkSize;
      const part = words.slice(start, start + chunkSize).join(' ');
      if (part) {
        chapters.push({ chapterNumber: chapters.length + 1, title: `Chapter ${chapters.length + 1}`, content: part });
      }
    }
  }

  return chapters;
}

function createFallbackChapters(topic) {
  const t = topic || 'the topic';
  return [
    {
      chapterNumber: 1,
      title: `Introduction to ${t}`,
      content: `This is a concise overview of ${t}. It outlines main ideas and objectives to provide learners with a clear starting point.`
    },
    {
      chapterNumber: 2,
      title: `Core Concepts of ${t}`,
      content: `This chapter covers the essential concepts of ${t} with simple explanations and illustrative examples.`
    },
    {
      chapterNumber: 3,
      title: `Practical Applications & Next Steps`,
      content: `This chapter suggests practical uses, exercises, and further reading to continue learning about ${t}.`
    }
  ];
} 

// Generate chapter-wise content
router.post('/generate', async (req, res) => {
  try {
    const { topic, sessionId } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Check if session exists
    let session = await Session.findOne({ sessionId });
    
    if (!session) {
      // Create new session
      session = new Session({
        sessionId: sessionId || `session_${Date.now()}`,
        topic
      });
    }

    // If Gemini API key is not configured, return a safe fallback immediately
    if (!process.env.GEMINI_API_KEY || !genAI) {
      console.warn('Gemini API key not configured; returning fallback content.');
      const fallback = createFallbackChapters(topic);
      session.chapters = fallback;
      session.totalChapters = fallback.length;
      session.currentChapter = 1;
      session.progress = Math.round((1 / fallback.length) * 100);
      await session.save();
      return res.json({
        sessionId: session.sessionId,
        chapters: fallback,
        currentChapter: session.currentChapter,
        totalChapters: session.totalChapters,
        progress: session.progress,
        usedFallback: true,
        warning: 'Gemini API key not configured. Get a free API key at https://makersuite.google.com/app/apikey'
      });
    }

    // Generate content using OpenAI - ChatGPT style comprehensive response
    const prompt = `Imagine someone asked ChatGPT: "Tell me everything about ${topic}". Generate that complete, comprehensive response, but split it into 5-7 detailed chapters.

Generate chapters exactly as ChatGPT would respond - covering ALL information about "${topic}":
- Everything you know about this topic
- Definitions, explanations, history, background
- All concepts, principles, theories, methodologies
- Types, variations, categories
- Applications, use cases, real-world examples
- Case studies, success stories
- Tools, technologies, resources
- Best practices, tips, tricks
- Common mistakes, challenges, solutions
- Benefits, advantages, limitations
- Comparisons with related topics
- Current state, trends, future outlook
- Everything else relevant to the topic

Each chapter should be 1000-1500 words of comprehensive content. Write naturally like ChatGPT - thorough, detailed, complete.

Format as JSON:
{
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Chapter Title",
      "content": "Full comprehensive chapter content (1000-1500 words) covering all aspects..."
    }
  ]
}`;

    console.log('Calling Gemini API for topic:', topic);
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);

    // Use GEMINI_MODEL env var with default 'gemini-1.5-flash' — try models via helper
    const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    console.log('Preferred Gemini model (config):', GEMINI_MODEL);

    const fullPrompt = `You are an expert AI assistant like ChatGPT. When users ask about any topic, you provide comprehensive, detailed, complete answers covering EVERYTHING about that topic. You don't give brief summaries - you explain thoroughly with all details, examples, history, concepts, applications, use cases, and related information.\n\n${prompt}\n\nCRITICAL JSON FORMATTING RULES:\n- Respond with ONLY valid JSON (no markdown, no code blocks, no extra text)\n- All special characters in strings MUST be properly escaped:\n  * Newlines must be \\n (not actual newlines)\n  * Quotes must be \\" (not actual quotes)\n  * Backslashes must be \\\\ (double backslashes)\n  * Tabs must be \\t\n- Do NOT include markdown formatting like **bold** or # headers\n- The JSON must be valid and parseable\n\nRequired JSON format:\n{\n  "chapters": [\n    {\n      "chapterNumber": 1,\n      "title": "Chapter Title",\n      "content": "Full comprehensive chapter content (1000-1500 words) with all special characters properly escaped..."\n    }\n  ]\n}`;

    // Try configured model first, then fall back to commonly available Gemini models
    responseContent = await tryGenerateWithGemini(fullPrompt);

    console.log('Gemini response received, length:', responseContent?.length);
    
    // Clean the response - remove markdown code blocks if present
    let cleanedContent = responseContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to extract JSON from the response (in case there's extra text)
    let jsonStart = cleanedContent.indexOf('{');
    let jsonEnd = cleanedContent.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
    }
    
    let generatedContent;
    
    // Function to extract and rebuild JSON properly
    function repairJson(jsonString) {
      try {
        // Try direct parse first
        return JSON.parse(jsonString);
      } catch (e) {
        // If that fails, manually extract chapters and rebuild
        const chapters = [];
        
        // Find all chapter objects using a more flexible approach
        // Look for: {"chapterNumber": X, "title": "...", "content": "..."}
        let chapterStart = -1;
        let depth = 0;
        let inString = false;
        let escaped = false;
        let contentFieldStart = -1;
        let contentValue = '';
        let currentChapter = {};
        
        for (let i = 0; i < jsonString.length; i++) {
          const char = jsonString[i];
          
          if (escaped) {
            if (contentFieldStart !== -1) {
              contentValue += char;
            }
            escaped = false;
            continue;
          }
          
          if (char === '\\') {
            escaped = true;
            if (contentFieldStart !== -1) {
              contentValue += char;
            }
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              if (depth === 0) {
                chapterStart = i;
                currentChapter = {};
              }
              depth++;
            } else if (char === '}') {
              depth--;
              if (depth === 0 && chapterStart !== -1) {
                // End of chapter object
                if (contentFieldStart !== -1) {
                  // Save the content (we've been collecting it)
                  currentChapter.content = contentValue;
                  contentFieldStart = -1;
                  contentValue = '';
                }
                if (currentChapter.chapterNumber && currentChapter.title && currentChapter.content) {
                  chapters.push({
                    chapterNumber: currentChapter.chapterNumber,
                    title: currentChapter.title,
                    content: currentChapter.content
                  });
                }
                chapterStart = -1;
                currentChapter = {};
              }
            } else if (char === ':' && jsonString.substring(Math.max(0, i-20), i).includes('"content"')) {
              // Found content field - start collecting its value
              contentFieldStart = i + 1;
              // Skip to the opening quote
              while (i < jsonString.length && jsonString[i] !== '"') i++;
              if (jsonString[i] === '"') {
                inString = true;
                i++; // Skip the opening quote
                contentValue = '';
              }
            } else if (char === ':' && jsonString.substring(Math.max(0, i-20), i).includes('"title"')) {
              // Extract title
              let titleStart = jsonString.indexOf('"', i) + 1;
              let titleEnd = titleStart;
              while (titleEnd < jsonString.length && (jsonString[titleEnd] !== '"' || jsonString[titleEnd-1] === '\\')) {
                titleEnd++;
              }
              currentChapter.title = jsonString.substring(titleStart, titleEnd).replace(/\\"/g, '"').replace(/\\n/g, '\n');
            } else if (char === ':' && jsonString.substring(Math.max(0, i-30), i).includes('"chapterNumber"')) {
              // Extract chapter number
              let numStart = i + 1;
              let numEnd = numStart;
              while (numEnd < jsonString.length && /[\d]/.test(jsonString[numEnd])) numEnd++;
              currentChapter.chapterNumber = parseInt(jsonString.substring(numStart, numEnd));
            }
          } else {
            // Inside a string
            if (contentFieldStart !== -1) {
              contentValue += char;
            }
          }
        }
        
        if (chapters.length > 0) {
          return { chapters };
        }
        throw e;
      }
    }
    
    try {
      // First attempt: direct parse
      generatedContent = JSON.parse(cleanedContent);
      console.log('Successfully parsed JSON on first attempt');
    } catch (parseError) {
      console.log('First parse attempt failed, trying JSON repair library...');
      
      try {
        // Second attempt: Use jsonrepair library to fix common JSON issues
        const repairedJson = jsonrepair(cleanedContent);
        generatedContent = JSON.parse(repairedJson);
        console.log('Successfully parsed after using jsonrepair library');
      } catch (secondParseError) {
        // Third attempt: Manual extraction using regex with proper handling
        try {
          console.log('Trying manual chapter extraction...');
          
          // Extract chapters by finding chapter objects one by one
          const chapters = [];
          let searchStart = 0;
          
          // Pattern to find chapter start
          const chapterStartPattern = /\{\s*"chapterNumber"\s*:\s*(\d+)/g;
          let match;
          
          while ((match = chapterStartPattern.exec(cleanedContent)) !== null) {
            const chapterStart = match.index;
            const chapterNum = parseInt(match[1]);
            
            // Find the title
            const titleMatch = cleanedContent.substring(chapterStart).match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (!titleMatch) continue;
            const title = titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
            
            // Find the content - this is tricky because it might have unescaped characters
            const contentMatch = cleanedContent.substring(chapterStart).match(/"content"\s*:\s*"/);
            if (!contentMatch) continue;
            
            const contentStartPos = chapterStart + contentMatch.index + contentMatch[0].length;
            // Now find where the content ends (closing quote followed by comma or })
            let contentEndPos = contentStartPos;
            let escaped = false;
            
            while (contentEndPos < cleanedContent.length) {
              const char = cleanedContent[contentEndPos];
              
              if (escaped) {
                escaped = false;
                contentEndPos++;
                continue;
              }
              
              if (char === '\\') {
                escaped = true;
                contentEndPos++;
                continue;
              }
              
              if (char === '"') {
                // Check if this is the end of content
                const after = cleanedContent.substring(contentEndPos + 1).trim();
                if (after.startsWith(',') || after.startsWith('}')) {
                  break;
                }
              }
              
              contentEndPos++;
            }
            
            const rawContent = cleanedContent.substring(contentStartPos, contentEndPos);
            // Clean up the content - remove escape sequences
            let content = rawContent
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            
            chapters.push({
              chapterNumber: chapterNum,
              title: title,
              content: content
            });
          }
          
          if (chapters.length > 0) {
            generatedContent = { chapters };
            console.log(`Successfully extracted ${chapters.length} chapters manually`);
          } else {
            throw new Error('No chapters found');
          }
        } catch (thirdParseError) {
          console.error('All JSON parsing attempts failed');
          console.error('Parse error:', parseError.message);
          console.error('Error position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');
          
          // Last resort: try to use Wikipedia fallback
          console.log('Attempting Wikipedia fallback due to JSON parsing failure...');
          try {
            const wikiChapters = await fetchWikipediaChapters(topic);
            session.chapters = wikiChapters;
            session.totalChapters = wikiChapters.length;
            session.currentChapter = 1;
            session.progress = Math.round((1 / wikiChapters.length) * 100);
            await session.save();
            
            return res.json({
              sessionId: session.sessionId,
              chapters: wikiChapters,
              currentChapter: session.currentChapter,
              totalChapters: session.totalChapters,
              progress: session.progress,
              usedFallback: 'wikipedia',
              warning: 'Gemini JSON parsing failed; used Wikipedia fallback content.'
            });
          } catch (wikiErr) {
            return res.status(500).json({ 
              error: 'Failed to parse AI response', 
              details: parseError.message,
              hint: 'The AI response contains invalid JSON that could not be repaired. Please try generating content again.'
            });
          }
        }
      }
    }
    
    // Validate generated content
    if (!generatedContent.chapters || !Array.isArray(generatedContent.chapters) || generatedContent.chapters.length === 0) {
      console.error('Gemini returned invalid content structure');
      console.error('Generated content:', JSON.stringify(generatedContent, null, 2));
      return res.status(500).json({ 
        error: 'Invalid content structure received from Gemini',
        details: 'The AI response did not contain valid chapters array'
      });
    }
    
    console.log(`Successfully generated ${generatedContent.chapters.length} chapters using Gemini`);
    
    // Update session with generated chapters
    session.chapters = generatedContent.chapters;
    session.totalChapters = generatedContent.chapters.length;
    session.currentChapter = 1;
    session.progress = Math.round((1 / generatedContent.chapters.length) * 100);
    await session.save();

    res.json({
      sessionId: session.sessionId,
      chapters: generatedContent.chapters,
      currentChapter: session.currentChapter,
      totalChapters: session.totalChapters,
      progress: session.progress
    });
  } catch (error) {
    console.error('Error generating content:', error);
    console.error('Error details:', error.message);
    console.error('Error status:', error.status);
    console.error('Error code:', error.code);

    // If all tried Gemini models failed, try a Wikipedia fallback so users still get content
    if (error.message && error.message.includes('All tried Gemini models failed')) {
      console.warn('Provider models failed — attempting Wikipedia fallback for topic:', req.body?.topic);
      try {
        const wikiChapters = await fetchWikipediaChapters(req.body?.topic || 'the topic');
        session.chapters = wikiChapters;
        session.totalChapters = wikiChapters.length;
        session.currentChapter = 1;
        session.progress = Math.round((1 / wikiChapters.length) * 100);
        await session.save();

        return res.json({
          sessionId: session.sessionId,
          chapters: wikiChapters,
          currentChapter: session.currentChapter,
          totalChapters: session.totalChapters,
          progress: session.progress,
          usedFallback: 'wikipedia',
          warning: 'Gemini models were unavailable; used Wikipedia fallback content.'
        });
      } catch (wikiErr) {
        console.error('Wikipedia fallback failed:', wikiErr.message || wikiErr);
        // continue to other error handling below
      }
    }

    // Handle specific error cases
    if (error.message && error.message.toLowerCase().includes('expired')) {
      return res.status(401).json({
        error: 'API key expired',
        message: 'Your Gemini API key has expired. Renew or create a new API key at https://makersuite.google.com/app/apikey and update backend/.env',
        details: error.message,
        code: 'api_key_expired'
      });
    }

    if (error.message && (error.message.includes('API_KEY_INVALID') || error.message.includes('401'))) {
      return res.status(401).json({ 
        error: 'Invalid API key', 
        message: 'Your Gemini API key is invalid. Please check your .env file.',
        details: 'Get a free API key at https://makersuite.google.com/app/apikey',
        code: 'invalid_api_key'
      });
    }
    
    if (error.message && (error.message.includes('quota') || error.message.includes('Quota') || error.message.includes('429'))) {
      return res.status(429).json({ 
        error: 'API quota exceeded', 
        message: 'Your Gemini API quota has been exceeded. Please try again later or check your API usage.',
        details: error.message,
        code: 'quota_exceeded'
      });
    }
    
    if (error.message && error.message.includes('404') && error.message.includes('model')) {
      return res.status(500).json({ 
        error: 'Model not found', 
        message: 'The Gemini model is not available. Please check the model name in the code.',
        details: error.message,
        code: 'model_not_found',
        hint: 'Try using gemini-1.5-flash or gemini-1.5-pro'
      });
    }
    
    // Return the actual error so user knows what went wrong
    return res.status(500).json({ 
      error: 'Failed to generate content', 
      message: error.message || 'Unknown error occurred',
      details: 'Please check your Gemini API key configuration and ensure the model is available',
      code: error.code || 'unknown_error'
    });
  }
});

// Get chapters for a session
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: session.sessionId,
      topic: session.topic,
      chapters: session.chapters || [],
      currentChapter: session.currentChapter || 1,
      totalChapters: session.totalChapters || 0,
      progress: session.progress || 0,
      restartCount: session.restartCount || 0,
      backCount: session.backCount || 0
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

module.exports = router;


