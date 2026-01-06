import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Avatar3D from '../components/Avatar3D';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">AIVA Tutor</div>
        <div className="landing-nav-links">
          <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-signup" onClick={() => navigate('/signup')}>Get Started</button>
        </div>
      </nav>

      <section className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="hero-title">
            Your Personal AI Tutor <br />
            <span style={{ color: '#4facfe' }}>with 3D Interaction</span>
          </h1>
          <p className="hero-subtitle">
            Experience the future of learning with AIVA. Interactive 3D avatars, 
            personalized chapters, and real-time voice feedback.
          </p>
          <div className="hero-cta">
            <button className="btn-signup" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => navigate('/signup')}>
              Start Learning Now
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          className="hero-avatar glass-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Reuse Avatar3D in idle mode */}
          <Avatar3D 
            avatarType="female" 
            onAvatarChange={() => {}} 
          />
        </motion.div>
      </section>

      <section className="features-section">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Why Choose AIVA?
        </motion.h2>
        
        <div className="features-grid">
          {[
            { icon: '🧠', title: 'AI-Powered Content', desc: 'Customized lessons generated instantly based on your interests.' },
            { icon: '🗣️', title: 'Voice Interaction', desc: 'Listen to your tutor explain complex concepts clearly.' },
            { icon: '🧊', title: '3D Immersion', desc: 'Engage with a lifelike 3D avatar that makes learning human.' },
            { icon: '📊', title: 'Smart Tracking', desc: 'Track your progress across chapters and sessions.' }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              className="feature-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>How It Works</h2>
        <div className="steps-container">
          {[
            { step: '01', title: 'Create Account', desc: 'Sign up in seconds to save your progress.' },
            { step: '02', title: 'Choose Topic', desc: 'Type anything you want to learn about.' },
            { step: '03', title: 'Start Learning', desc: 'Watch your AI tutor generate a full course instantly.' }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              className="step-card glass-card"
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="step-number">{item.step}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2026 AIVA Tutor. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
