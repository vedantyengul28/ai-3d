import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ContentDisplay.css';

// Load voices when available
let voicesLoaded = false;
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    voicesLoaded = true;
  };
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  loadVoices(); // Try to load immediately
}

function ContentDisplay({ chapters, currentChapter, onChapterChange, sessionId, avatarType = 'male', isLoading = false }) {
  const [isReading, setIsReading] = useState(false);
  const [currentSpeechChapter, setCurrentSpeechChapter] = useState(currentChapter);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  // Get appropriate voice based on avatar type
  const getVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    if (avatarType === 'female') {
      // Try to find a female voice (usually voices with "Female" in name or certain voice names)
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('zira') || // Windows female voice
        voice.name.toLowerCase().includes('samantha') || // Mac female voice
        voice.name.toLowerCase().includes('karen') || // Australian female
        voice.name.toLowerCase().includes('veena') || // Indian female
        voice.name.toLowerCase().includes('tessa') || // South African female
        voice.name.toLowerCase().includes('susan') ||
        voice.name.toLowerCase().includes('hazel') ||
        (voice.gender && voice.gender === 'female')
      );
      return femaleVoice || voices.find(voice => voice.lang.startsWith('en'));
    } else {
      // Male voice (default)
      const maleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('david') || // Windows male voice
        voice.name.toLowerCase().includes('alex') || // Mac male voice
        voice.name.toLowerCase().includes('daniel') || // UK male
        voice.name.toLowerCase().includes('james') ||
        voice.name.toLowerCase().includes('mark') ||
        (voice.gender && voice.gender === 'male')
      );
      return maleVoice || voices.find(voice => voice.lang.startsWith('en'));
    }
  }, [avatarType]);

  const stopReading = useCallback(() => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    setIsReading(false);
  }, []);

  const startReadingFromChapter = useCallback((chapterNum) => {
    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) return;
    if (chapterNum < 1 || chapterNum > chapters.length) return;

    const chapter = chapters[chapterNum - 1];
    if (!chapter) return;

    const textToRead = `Chapter ${chapterNum}: ${chapter.title}. ${chapter.content}`;

    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    // Ensure voices are loaded before setting voice
    const setupUtterance = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Voices not loaded yet, wait and try again
        setTimeout(setupUtterance, 100);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.9;
      utterance.pitch = avatarType === 'female' ? 1.1 : 1.0; // Higher pitch for female
      utterance.volume = 1;
      
      // Set voice based on avatar type
      const selectedVoice = getVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        // Automatically move to next chapter
        if (chapterNum < chapters.length) {
          setCurrentSpeechChapter(chapterNum + 1);
          onChapterChange(chapterNum + 1, false, false);
          setTimeout(() => {
            startReadingFromChapter(chapterNum + 1);
          }, 500);
        } else {
          setIsReading(false);
          // Restart from chapter 1 if reached the end
          setTimeout(() => {
            setCurrentSpeechChapter(1);
            onChapterChange(1, true, false);
            startReadingFromChapter(1);
          }, 1000);
        }
      };

      utterance.onerror = (event) => {
        // Ignore "interrupted" errors as they're expected when canceling speech
        if (event.error !== 'interrupted') {
          console.error('Speech synthesis error:', event.error, event);
          setIsReading(false);
        }
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
      setIsReading(true);
    };
    
    setupUtterance();
  }, [chapters, onChapterChange, avatarType, getVoice]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Update current speech chapter display when currentChapter changes
  // Note: We don't auto-restart reading here to avoid interrupting speech
  // The onend handler in startReadingFromChapter manages chapter progression
  useEffect(() => {
    setCurrentSpeechChapter(currentChapter);
  }, [currentChapter]);

  const startReading = () => {
    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) return;
    // Always start reading from chapter 1 when user clicks "Start Reading"
    setCurrentSpeechChapter(1);
    onChapterChange(1, true, false);
    startReadingFromChapter(1);
  };

  const goToNextChapter = () => {
    if (currentChapter < chapters.length) {
      onChapterChange(currentChapter + 1, false, false);
    }
  };

  const goToPreviousChapter = () => {
    if (currentChapter > 1) {
      onChapterChange(currentChapter - 1, false, true);
    }
  };

  const restartFromChapter1 = () => {
    onChapterChange(1, true, false);
    setCurrentSpeechChapter(1);
  };

  if (isLoading) {
    return (
      <div className="content-display">
        <div className="loading-container">
          <div className="loading-bar"></div>
          <div className="loading-text">AI is preparing lesson…</div>
          <div className="shimmer-lines">
            <div className="line"></div>
            <div className="line"></div>
            <div className="line short"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!chapters || chapters.length === 0) {
    return (
      <div className="content-display">
        <div className="empty-state">
          <h2>Welcome to AI 3D Learning Platform</h2>
          <p>Enter a topic above to generate educational content</p>
        </div>
      </div>
    );
  }

  const currentChapterData = chapters[currentChapter - 1];

  return (
    <div className="content-display">
      <div className="content-header">
        <h1>{currentChapterData?.title || `Chapter ${currentChapter}`}</h1>
        <div className="chapter-navigation">
          <button
            onClick={goToPreviousChapter}
            disabled={currentChapter === 1}
            className="nav-button"
          >
            ← Previous
          </button>
          <span className="chapter-counter">
            Chapter {currentChapter} of {chapters.length}
          </span>
          <button
            onClick={goToNextChapter}
            disabled={currentChapter === chapters.length}
            className="nav-button"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="content-controls">
        <button
          onClick={isReading ? stopReading : startReading}
          className={`control-button ${isReading ? 'stop' : 'play'}`}
        >
          {isReading ? '⏸ Stop Reading' : '▶ Start Reading'}
        </button>
        <button
          onClick={restartFromChapter1}
          className="control-button restart"
        >
          🔄 Restart from Chapter 1
        </button>
      </div>

      <div className="content-body">
        <div className="chapter-content">
          {currentChapterData?.content || 'Loading...'}
        </div>
      </div>

      {isReading && (
        <div className="reading-indicator">
          <span className="pulse">🔊 Reading Chapter {currentSpeechChapter}...</span>
        </div>
      )}
    </div>
  );
}

export default ContentDisplay;
