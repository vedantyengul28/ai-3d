import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; // Reuse styles

export default function Dashboard() {
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setError('');

    try {
      await logout();
      navigate('/login');
    } catch {
      setError('Failed to log out');
    }
  }

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">AIVA Tutor Dashboard</div>
        <div className="landing-nav-links">
          <span style={{ marginRight: '1rem', color: 'rgba(255,255,255,0.7)' }}>
            {currentUser ? currentUser.email : 'User'}
          </span>
          <button className="btn-login" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div style={{ padding: '4rem 8rem' }}>
        {error && <div style={{ background: 'rgba(255,0,0,0.2)', padding: '10px', borderRadius: '5px', marginBottom: '1rem' }}>{error}</div>}
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Welcome back!</h1>
        
        <div className="features-grid" style={{ marginTop: '0' }}>
          {/* Main Action Card */}
          <div className="glass-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(45deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)' }}>
            <h2>Ready to learn?</h2>
            <p style={{ margin: '1rem 0 2rem', color: 'rgba(255,255,255,0.7)' }}>
              Continue where you left off or explore a new topic with your AI tutor.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-signup" 
                style={{ padding: '0.8rem 1.5rem' }}
                onClick={() => navigate('/learn')}
              >
                Start New Session
              </button>
              <button 
                className="btn-login" 
                style={{ padding: '0.8rem 1.5rem' }}
                onClick={() => navigate('/learn')}
              >
                Continue Learning
              </button>
            </div>
          </div>

          {/* Stats Card (Dummy) */}
          <div className="glass-card">
            <h3>Your Progress</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Total Sessions</span>
                  <span>12</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                  <div style={{ width: '60%', height: '100%', background: '#4facfe', borderRadius: '3px' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Chapters Completed</span>
                  <span>45</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                  <div style={{ width: '85%', height: '100%', background: '#00f2fe', borderRadius: '3px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 style={{ marginTop: '4rem', marginBottom: '2rem' }}>Recent Topics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {['React.js Basics', 'Quantum Physics', 'French Revolution', 'Machine Learning'].map((topic, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/learn')}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{topic}</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Last accessed 2 days ago</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
