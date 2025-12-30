import React from 'react';
import './ProgressTracker.css';

function ProgressTracker({ progress, currentChapter, totalChapters, restartCount, backCount }) {
  return (
    <div className="progress-tracker-container">
      <h3>Progress</h3>
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">{progress}%</span>
      </div>
      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-label">Chapter:</span>
          <span className="stat-value">
            {currentChapter} / {totalChapters || 0}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Restarts:</span>
          <span className="stat-value">{restartCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Back Count:</span>
          <span className="stat-value">{backCount}</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressTracker;




