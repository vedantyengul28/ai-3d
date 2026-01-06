import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
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

  const currentChapterData = chapters && chapters[currentChapter - 1] ? chapters[currentChapter - 1] : null;

  const sections = useMemo(() => {
    // Priority 1: Use structured sections from backend if available
    if (currentChapterData && Array.isArray(currentChapterData.sections) && currentChapterData.sections.length > 0) {
      return currentChapterData.sections.map((s, idx) => ({
        title: s.sectionTitle || s.title || `Section ${idx + 1}`,
        text: s.content || s.text || ''
      }));
    }

    // Priority 2: Parse legacy flat content
    const out = [];
    if (!currentChapterData || !currentChapterData.content) return out;
    const content = String(currentChapterData.content);
    const lines = content.split(/\r?\n/);
    const headerMap = {
      definition: 'Definition',
      explanation: 'Explanation',
      example: 'Example',
      keypoints: 'Key Points'
    };
    let current = null;
    lines.forEach(l => {
      const line = l.trim();
      if (!line) {
        if (current) current.text += '\n\n';
        return;
      }
      const lower = line.toLowerCase();
      if (lower.startsWith('definition')) {
        current = { title: headerMap.definition, text: '' };
        out.push(current);
        return;
      }
      if (lower.startsWith('explanation')) {
        current = { title: headerMap.explanation, text: '' };
        out.push(current);
        return;
      }
      if (lower.startsWith('example')) {
        current = { title: headerMap.example, text: '' };
        out.push(current);
        return;
      }
      if (lower.startsWith('key points') || lower.startsWith('keypoints') || lower.startsWith('key point')) {
        current = { title: headerMap.keypoints, text: '' };
        out.push(current);
        return;
      }
      if (!current) {
        current = { title: headerMap.definition, text: '' };
        out.push(current);
      }
      current.text += (current.text ? '\n' : '') + line;
    });
    if (out.length === 0) {
      const paras = content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      const titles = [headerMap.definition, headerMap.explanation, headerMap.example, headerMap.keypoints];
      paras.forEach((p, idx) => {
        const title = titles[Math.min(idx, titles.length - 1)];
        out.push({ title, text: p });
      });
    }
    return out;
  }, [currentChapterData]);

  useEffect(() => {
    setCurrentSectionIndex(0);
    setIsReading(false);
    if (synthRef.current.speaking) synthRef.current.cancel();
  }, [currentChapter]);

  const speakText = useCallback((text, preface) => {
    if (!text) return;
    if (synthRef.current.speaking) synthRef.current.cancel();

    const setupUtterance = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        setTimeout(setupUtterance, 100);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(preface ? `${preface} ${text}` : text);
      utterance.rate = 0.9;
      utterance.pitch = avatarType === 'female' ? 1.1 : 1.0;
      utterance.volume = 1;
      const selectedVoice = getVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        setIsReading(false);
      };

      utterance.onerror = (event) => {
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
  }, [avatarType, getVoice]);

  useEffect(() => {
    return () => {
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const playSection = () => {
    const section = sections[currentSectionIndex];
    if (!section) return;
    const preface = `Section ${currentSectionIndex + 1}: ${section.title}.`;
    speakText(section.text, preface);
  };

  const replaySection = () => {
    stopReading();
    setTimeout(() => playSection(), 200);
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

  const nextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setIsReading(false);
      if (synthRef.current.speaking) synthRef.current.cancel();
    }
  };

  const prevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setIsReading(false);
      if (synthRef.current.speaking) synthRef.current.cancel();
    }
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

  const section = sections[currentSectionIndex];
  const chapterTitle = currentChapterData?.title || currentChapterData?.chapterTitle || `Chapter ${currentChapter}`;

  return (
    <div className="content-display">
      <div className="content-header">
        <h1>{chapterTitle}</h1>
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

      <div className="section-header">
        <div className="section-title">{section ? section.title : 'Section'}</div>
        <div className="section-progress">Section {Math.min(currentSectionIndex + 1, sections.length)} of {sections.length || 0}</div>
      </div>

      <div className="content-controls">
        <button
          onClick={isReading ? stopReading : playSection}
          className={`control-button ${isReading ? 'stop' : 'play'}`}
        >
          {isReading ? '⏸ Stop Reading' : '▶ Play Section'}
        </button>
        <button
          onClick={replaySection}
          className="control-button restart"
        >
          � Replay Section
        </button>
        <button
          onClick={prevSection}
          disabled={currentSectionIndex === 0}
          className="control-button nav-button"
        >
          ← Previous Section
        </button>
        <button
          onClick={nextSection}
          disabled={currentSectionIndex >= sections.length - 1}
          className="control-button nav-button"
        >
          Next Section →
        </button>
      </div>

      <div className="content-body">
        <div className="chapter-content">
          {section ? section.text : (currentChapterData?.content || 'Loading...')}
        </div>
      </div>

      {isReading && (
        <div className="reading-indicator">
          <span className="pulse">🔊 Reading Section {currentSectionIndex + 1}: {section ? section.title : ''}</span>
        </div>
      )}
    </div>
  );
}

export default ContentDisplay;
