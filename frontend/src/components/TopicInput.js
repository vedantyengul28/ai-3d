import React, { useState } from 'react';
import './TopicInput.css';

function TopicInput({ onSubmit, currentTopic }) {
  const [topic, setTopic] = useState(currentTopic || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic.trim());
    }
  };

  return (
    <div className="topic-input-container">
      <form onSubmit={handleSubmit} className="topic-input-form">
        <label htmlFor="topic">Enter Learning Topic</label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Introduction to Machine Learning"
          className="topic-input"
        />
        <button type="submit" className="submit-button">
          Generate Content
        </button>
      </form>
    </div>
  );
}

export default TopicInput;




