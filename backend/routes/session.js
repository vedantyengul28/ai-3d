const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Update session progress
router.put('/:sessionId/progress', async (req, res) => {
  try {
    const { currentChapter, restartCount, backCount } = req.body;
    const session = await Session.findOne({ sessionId: req.params.sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (currentChapter !== undefined) {
      session.currentChapter = currentChapter;
      session.progress = Math.round((currentChapter / session.totalChapters) * 100);
    }
    
    if (restartCount !== undefined) {
      session.restartCount = restartCount;
    }
    
    if (backCount !== undefined) {
      session.backCount = backCount;
    }

    await session.save();

    res.json({
      sessionId: session.sessionId,
      currentChapter: session.currentChapter,
      progress: session.progress,
      restartCount: session.restartCount,
      backCount: session.backCount
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Get session details
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: session.sessionId,
      topic: session.topic,
      currentChapter: session.currentChapter,
      totalChapters: session.totalChapters,
      progress: session.progress,
      restartCount: session.restartCount,
      backCount: session.backCount,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Get all sessions (for admin)
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find({})
      .select('sessionId userEmail topic progress restartCount backCount currentChapter totalChapters createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

module.exports = router;




