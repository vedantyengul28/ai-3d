import React, { useState, useEffect } from 'react';
import '../App.css';
import TopicInput from '../components/TopicInput';
import ContentDisplay from '../components/ContentDisplay';
import Avatar3D from '../components/Avatar3D';
import ProgressTracker from '../components/ProgressTracker';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

// Client-side fallback generator in case backend is unavailable or fails
const generateFallbackChapters = (topic) => {
  const t = topic || 'the topic';
  return [
    {
      chapterNumber: 1,
      title: `Introduction to ${t}`,
      content: `Welcome to the comprehensive course on ${t}. \n\nIn this initial module, we will explore the fundamental concepts, historical context, and significance of ${t}. This overview sets the stage for a deeper dive into specific areas.\n\nKey discussion points:\n- Origins and definition of ${t}\n- Importance in the modern context\n- Brief historical timeline`,
      sections: [
        {
          title: "Course Overview",
          content: `Welcome to the comprehensive course on ${t}. In this initial module, we will explore the fundamental concepts, historical context, and significance of ${t}. This overview sets the stage for a deeper dive into specific areas.`
        },
        {
          title: "Key Discussion Points",
          content: `We will focus on:\n- Origins and definition of ${t}\n- Importance in the modern context\n- Brief historical timeline`
        }
      ]
    },
    {
      chapterNumber: 2,
      title: `Core Principles and Fundamentals`,
      content: `Let's examine the core principles that define ${t}. \n\nUnderstanding these foundational elements is crucial. We will look at:\n\n1. Primary definitions and scope\n2. Major theoretical frameworks\n3. Critical components and their interactions\n\nMastering these basics will provide a solid platform for advanced study.`,
      sections: [
        {
          title: "Foundational Elements",
          content: `Let's examine the core principles that define ${t}. Understanding these foundational elements is crucial for any practitioner in the field.`
        },
        {
          title: "Scope and Frameworks",
          content: `We will look at:\n1. Primary definitions and scope\n2. Major theoretical frameworks\n3. Critical components and their interactions`
        },
        {
          title: "Why it Matters",
          content: `Mastering these basics will provide a solid platform for advanced study and practical application.`
        }
      ]
    },
    {
      chapterNumber: 3,
      title: `Advanced Concepts in ${t}`,
      content: `Moving beyond the basics, this chapter delves into the complex nuances of ${t}. We will explore advanced methodologies, theoretical paradoxes, and high-level strategies used by experts in the field.`,
      sections: [
        {
          title: "Beyond the Basics",
          content: `Moving beyond the basics, this chapter delves into the complex nuances of ${t}.`
        },
        {
          title: "Expert Strategies",
          content: `We will explore advanced methodologies, theoretical paradoxes, and high-level strategies used by experts in the field.`
        }
      ]
    },
    {
      chapterNumber: 4,
      title: `Tools, Technologies, and Ecosystem`,
      content: `What tools drive ${t}? This chapter surveys the technological landscape, including software, hardware, and frameworks that support ${t}. We'll discuss how to select the right tools for different scenarios.`,
      sections: [
        {
          title: "Technological Landscape",
          content: `What tools drive ${t}? This chapter surveys the technological landscape, including software, hardware, and frameworks that support ${t}.`
        },
        {
          title: "Selection Strategy",
          content: `We'll discuss how to select the right tools for different scenarios.`
        }
      ]
    },
    {
      chapterNumber: 5,
      title: `Real-world Applications and Case Studies`,
      content: `How is ${t} applied in the real world? \n\nThis chapter covers practical applications across different industries and scenarios. We'll analyze case studies to see how theoretical knowledge translates into tangible results.`,
      sections: [
        {
          title: "Practical Applications",
          content: `How is ${t} applied in the real world? This chapter covers practical applications across different industries and scenarios.`
        },
        {
          title: "Case Studies",
          content: `We'll analyze case studies to see how theoretical knowledge translates into tangible results.`
        }
      ]
    },
    {
      chapterNumber: 6,
      title: `Best Practices and Methodologies`,
      content: `Success in ${t} requires following established best practices. We will outline industry standards, optimized workflows, and quality assurance measures to ensure high outcomes.`,
      sections: [
        {
          title: "Industry Standards",
          content: `Success in ${t} requires following established best practices. We will outline industry standards.`
        },
        {
          title: "Quality Assurance",
          content: `Optimized workflows and quality assurance measures to ensure high outcomes.`
        }
      ]
    },
    {
      chapterNumber: 7,
      title: `Challenges, Risks, and Solutions`,
      content: `Every field faces challenges, and ${t} is no exception. \n\nWe will discuss current limitations, ethical considerations, common pitfalls, and effective mitigation strategies.`,
      sections: [
        {
          title: "Current Limitations",
          content: `Every field faces challenges, and ${t} is no exception. We will discuss current limitations.`
        },
        {
          title: "Mitigation Strategies",
          content: `Ethical considerations, common pitfalls, and effective mitigation strategies.`
        }
      ]
    },
    {
      chapterNumber: 8,
      title: `Future Trends and Innovations`,
      content: `What lies ahead for ${t}? We will predict future trends, emerging technologies, and how the landscape might evolve over the next decade.`,
      sections: [
        {
          title: "Predictions",
          content: `What lies ahead for ${t}? We will predict future trends.`
        },
        {
          title: "Emerging Tech",
          content: `Emerging technologies and how the landscape might evolve over the next decade.`
        }
      ]
    },
    {
      chapterNumber: 9,
      title: `Conclusion and Next Steps`,
      content: `To wrap up our session on ${t}, let's review the key takeaways. \n\nWe've covered the basics, applications, and future trends. Continue exploring this fascinating topic through further reading and practice exercises.`,
      sections: [
        {
          title: "Key Takeaways",
          content: `To wrap up our session on ${t}, let's review the key takeaways. We've covered the basics, applications, and future trends.`
        },
        {
          title: "Continuing Education",
          content: `Continue exploring this fascinating topic through further reading and practice exercises.`
        }
      ]
    }
  ];
};

function LearningPage() {
  const [topic, setTopic] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [avatarType, setAvatarType] = useState('male');
  const [progress, setProgress] = useState(0);
  const [restartCount, setRestartCount] = useState(0);
  const [backCount, setBackCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const savedSessionId = localStorage.getItem('sessionId');
    const savedTopic = localStorage.getItem('topic');
    const savedCurrentChapter = localStorage.getItem('currentChapter');
    const savedRestartCount = localStorage.getItem('restartCount');
    const savedBackCount = localStorage.getItem('backCount');

    if (savedSessionId && savedTopic) {
      setSessionId(savedSessionId);
      setTopic(savedTopic);
      setCurrentChapter(savedCurrentChapter ? parseInt(savedCurrentChapter) : 1);
      setRestartCount(savedRestartCount ? parseInt(savedRestartCount) : 0);
      setBackCount(savedBackCount ? parseInt(savedBackCount) : 0);
      fetchSessionData(savedSessionId);
    }
  }, []);

  const fetchSessionData = async (sid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/content/${sid}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.chapters)) {
          setChapters(data.chapters);
          setCurrentChapter(data.currentChapter || 1);
          setProgress(data.progress || 0);
          setRestartCount(data.restartCount || 0);
          setBackCount(data.backCount || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const handleTopicSubmit = async (newTopic) => {
    const newSessionId = `session_${Date.now()}`;
    setTopic(newTopic);
    setSessionId(newSessionId);
    setCurrentChapter(1);
    setRestartCount(0);
    setBackCount(0);

    localStorage.setItem('sessionId', newSessionId);
    localStorage.setItem('topic', newTopic);
    localStorage.setItem('currentChapter', '1');
    localStorage.setItem('restartCount', '0');
    localStorage.setItem('backCount', '0');

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/content/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: newTopic, 
          sessionId: newSessionId,
          userEmail: currentUser?.email 
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate content');
      }

      setChapters(data.chapters || []);
      setCurrentChapter(data.currentChapter || 1);
      setProgress(data.progress || 0);
      setIsLoading(false);
    } catch (error) {
      console.warn('Backend generation failed, using client-side fallback:', error);
      // Fallback to client-side generation if backend fails
      const fallbackChapters = generateFallbackChapters(newTopic);
      setChapters(fallbackChapters);
      setCurrentChapter(1);
      setProgress(Math.round((1 / fallbackChapters.length) * 100));
      // Save fallback session data locally so it persists on reload
      localStorage.setItem('topic', newTopic);
      localStorage.setItem('currentChapter', '1');
      setIsLoading(false);
    }
  };

  const handleChapterChange = async (newChapter, isRestart = false, isBack = false) => {
    if (!chapters.length) return;

    let newRestartCount = restartCount;
    let newBackCount = backCount;

    if (isRestart && newChapter === 1) newRestartCount++;
    if (isBack && newChapter < currentChapter) newBackCount++;

    setCurrentChapter(newChapter);
    setRestartCount(newRestartCount);
    setBackCount(newBackCount);

    const newProgress = Math.round((newChapter / chapters.length) * 100);
    setProgress(newProgress);

    localStorage.setItem('currentChapter', newChapter.toString());
    localStorage.setItem('restartCount', newRestartCount.toString());
    localStorage.setItem('backCount', newBackCount.toString());

    if (sessionId) {
      try {
        await fetch(`${API_BASE_URL}/api/session/${sessionId}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentChapter: newChapter,
            restartCount: newRestartCount,
            backCount: newBackCount
          })
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="app-root dark-theme">

      {/* ===== TOP NAVBAR ===== */}
      <nav className="top-navbar glass">
        <div className="logo">AI 3D Tutor</div>
        <div className="nav-actions">
          {/* Preserving existing UI elements as requested */}
          <button className="nav-btn ghost">Sign In</button>
          <button className="nav-btn primary">Login</button>
        </div>
      </nav>

      {/* ===== MAIN LAYOUT ===== */}
      <main className="main-layout">

        {/* LEFT PANEL (Topic + Gender + Progress) */}
        <section className="side-panel left glass">
          <TopicInput
            onSubmit={handleTopicSubmit}
            currentTopic={topic}
            avatarType={avatarType}
            onAvatarChange={setAvatarType}
          />

          {/* Gender Selection */}
          <div className="gender-selection-container">
            <h3 className="panel-title">Instructor</h3>
            <div className="gender-toggle">
              <button
                className={`gender-btn ${avatarType === 'male' ? 'active' : ''}`}
                onClick={() => setAvatarType('male')}
              >
                <span>👨‍🏫</span> Male
              </button>
              <button
                className={`gender-btn ${avatarType === 'female' ? 'active' : ''}`}
                onClick={() => setAvatarType('female')}
              >
                <span>👩‍🏫</span> Female
              </button>
            </div>
          </div>

          <ProgressTracker
            progress={progress}
            currentChapter={currentChapter}
            totalChapters={chapters.length}
            restartCount={restartCount}
            backCount={backCount}
          />
        </section>

        {/* CENTER PANEL (Content) */}
        <section className="center-panel glass">
          <ContentDisplay
            chapters={chapters}
            currentChapter={currentChapter}
            onChapterChange={handleChapterChange}
            sessionId={sessionId}
            avatarType={avatarType}
            isLoading={isLoading}
          />
        </section>

        {/* RIGHT PANEL (Avatar) */}
        <section className="side-panel right">
          <div className="sticky-avatar-container">
            <div className="avatar-glass-wrapper glass">
              <Avatar3D
                avatarType={avatarType}
                onAvatarChange={setAvatarType}
                minimal={true}
              />
              <div className="avatar-status">
                <span className="status-dot"></span>
                {chapters.length ? 'Teaching…' : 'Idle'}
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default LearningPage;
