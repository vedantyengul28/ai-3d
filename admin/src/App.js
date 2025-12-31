import React, { useState, useEffect } from 'react';
import './App.css';
import SessionTable from './components/SessionTable';

function App() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL;

      const response = await fetch(`${API_URL}/api/session`);

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await response.json();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>AI 3D Learning Platform - Session Monitoring</p>
      </header>
      <main className="admin-main">
        <div className="dashboard-controls">
          <button onClick={fetchSessions} className="refresh-button">
            🔄 Refresh
          </button>
          <span className="session-count">
            Total Sessions: {sessions.length}
          </span>
        </div>
        {loading ? (
          <div className="loading">Loading sessions...</div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : (
          <SessionTable sessions={sessions} />
        )}
      </main>
    </div>
  );
}

export default App;




