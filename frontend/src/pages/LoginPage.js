import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css'; // Reuse styles

export default function LoginPage() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate('/dashboard');
    } catch {
      setError('Failed to log in. Check your email and password.');
    }

    setLoading(false);
  }

  return (
    <div className="landing-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Log In</h2>
        {error && <div style={{ background: 'rgba(255,0,0,0.2)', padding: '10px', borderRadius: '5px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Email</label>
            <input 
              type="email" 
              ref={emailRef} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '5px' }}
            />
          </div>
          <div>
            <label>Password</label>
            <input 
              type="password" 
              ref={passwordRef} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '5px' }}
            />
          </div>
          <button disabled={loading} className="btn-signup" style={{ marginTop: '1rem', padding: '10px' }} type="submit">
            Log In
          </button>
        </form>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          Need an account? <Link to="/signup" style={{ color: '#4facfe' }}>Sign Up</Link>
        </div>
        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.5)' }}>Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
