import React from 'react';
import './SessionTable.css';

function SessionTable({ sessions }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (sessions.length === 0) {
    return (
      <div className="empty-sessions">
        <p>No sessions found. Sessions will appear here when users start learning.</p>
      </div>
    );
  }

  return (
    <div className="session-table-container">
      <table className="session-table">
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Topic</th>
            <th>Progress</th>
            <th>Current Chapter</th>
            <th>Total Chapters</th>
            <th>Restart Count</th>
            <th>Back Count</th>
            <th>Created At</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.sessionId}>
              <td className="user-email">{session.userEmail || 'Unknown User'}</td>
              <td className="topic">{session.topic}</td>
              <td>
                <div className="progress-cell">
                  <div className="progress-bar-mini">
                    <div
                      className="progress-fill-mini"
                      style={{ width: `${session.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text-mini">{session.progress}%</span>
                </div>
              </td>
              <td>{session.currentChapter || 0}</td>
              <td>{session.totalChapters || 0}</td>
              <td>
                <span className="count-badge restart">{session.restartCount || 0}</span>
              </td>
              <td>
                <span className="count-badge back">{session.backCount || 0}</span>
              </td>
              <td>{formatDate(session.createdAt)}</td>
              <td>{formatDate(session.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SessionTable;




