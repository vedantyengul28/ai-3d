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
  // Expanded list of models to try, including newer and older variants to maximize success chance
  const initialCandidates = [
    ...new Set([
      ...preferred,
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.0-pro',
      'gemini-pro'
    ])
  ];

  // Try initial candidates first
  for (const m of initialCandidates) {
    try {
      console.log('Trying Gemini model:', m);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent(genPrompt);
      const response = await result.response;
      const text = response.text();
      if (!text) throw new Error('Empty response from model');
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

// Generate chapter-wise content
router.post('/generate', async (req, res) => {
  let session = null;

  try {
    const { topic, sessionId } = req.body;
    const userEmail = req.user?.email || req.body?.userEmail || req.headers["x-user-email"] || "anonymous@aiva.ai";

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Check if session exists
    session = await Session.findOne({ sessionId });
    
    if (!session) {
      // Create new session
      session = new Session({
        sessionId: sessionId || `session_${Date.now()}`,
        topic,
        userEmail
      });
    }

    // If Gemini API key is not configured, return an error immediately (Strict Requirement)
    if (!process.env.GEMINI_API_KEY || !genAI) {
      console.error('Gemini API key not configured.');
      return res.status(500).json({
        error: 'AI service not configured. Please contact support.' 
      });
    }

    // Generate content using the new prompt structure
    // RESTORED: Dynamic chapter and section generation based on topic complexity (User Requirement)
    const prompt = `You are an AI tutor for a learning platform.
For the topic: "${topic}", generate content in a well-structured educational format.

STRICTLY follow this structure:
Topic
→ Chapters (if applicable)
→ Each chapter MUST contain one or more SECTIONS (depending on complexity)

Each section should:
- Cover ONLY ONE clear concept
- Be short (5–8 lines max)
- Be understandable for a student
- Stop naturally (do NOT continue endlessly)

Each section must include:
1. Section title
2. Section explanation
3. (Optional) Example or short analogy

IMPORTANT RULES:
- Do NOT merge all content into one section
- Do NOT generate a single long paragraph
- Always generate at least 3–6 sections per chapter
- Assume the content will be spoken using text-to-speech, so pauses between sections are required
- Do NOT include greetings, conclusions, or summaries unless asked
- Generate 5-8 chapters for this topic.

Output FORMAT (JSON only, no extra text):

{
  "topic": "${topic}",
  "chapters": [
    {
      "chapterTitle": "<chapter_title>",
      "sections": [
        {
          "sectionTitle": "<section_title>",
          "content": "<clear explanation>"
        }
      ]
    }
  ]
}`;

    console.log('Calling Gemini API for topic:', topic);
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);

    // Use GEMINI_MODEL env var with default 'gemini-1.5-flash' — try models via helper
    const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    console.log('Preferred Gemini model (config):', GEMINI_MODEL);

    const fullPrompt = `You are an expert AI tutor. Respond with valid JSON only.\n\n${prompt}`;

    // Try configured model first, then fall back to commonly available Gemini models
    const responseContent = await tryGenerateWithGemini(fullPrompt);

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
        console.error('All JSON parsing attempts failed');
        // Fallback to Wikipedia
        throw new Error('JSON parsing failed');
      }
    }

    // Validate generated content
    if (!generatedContent.chapters || !Array.isArray(generatedContent.chapters) || generatedContent.chapters.length === 0) {
      console.error('Gemini returned invalid content structure');
      throw new Error('Invalid content structure');
    }

    console.log(`Successfully generated ${generatedContent.chapters.length} chapters using Gemini`);

    // Map to DB structure and flatten content for fallback/compatibility
    const chapters = generatedContent.chapters.map((ch, index) => {
      // Handle "sections" if present, otherwise assume it might be old format or just content
      const sections = ch.sections || [];
      const title = ch.chapterTitle || ch.title || `Chapter ${index + 1}`;

      // Create a flattened content string for legacy compatibility or full-text search
      let flatContent = '';
      if (sections.length > 0) {
        flatContent = sections.map(s => `### ${s.sectionTitle}\n\n${s.content}`).join('\n\n');
      } else if (ch.content) {
        flatContent = ch.content;
      }

      return {
        chapterNumber: index + 1,
        title: title,
        sections: sections,
        content: flatContent
      };
    });

    // Update session with generated chapters
    session.chapters = chapters;
    session.totalChapters = chapters.length;
    session.currentChapter = 1;
    session.progress = Math.round((1 / chapters.length) * 100);
    await session.save();

    res.json({
      sessionId: session.sessionId,
      chapters: chapters,
      currentChapter: session.currentChapter,
      totalChapters: session.totalChapters,
      progress: session.progress
    });
  } catch (error) {
    console.error('Error generating content:', error);

    // FINAL FALLBACK STRATEGY:
    // If Gemini fails, we throw an error as per strict requirements.
    // No Wikipedia fallback allowed.
    console.error('Gemini generation failed:', error);
    return res.status(500).json({
      error: 'Failed to generate content. Please try again later.',
      details: error.message 
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
