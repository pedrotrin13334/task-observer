import React, { useState, useEffect } from 'react';
import './Task.css';
import { formatDistance, format } from 'date-fns';

const Task = ({ task, onComplete }) => {
  const [expanded, setExpanded] = useState(false);
  const [timeSinceLast, setTimeSinceLast] = useState('');
  const [completionHistory, setCompletionHistory] = useState([]);

  useEffect(() => {
    // Update time since last completion every minute
    const updateTimeSinceLast = () => {
      if (task.last_completed) {
        const last = new Date(task.last_completed);
        const now = new Date();
        setTimeSinceLast(formatDistance(last, now, { addSuffix: true }));
      } else {
        setTimeSinceLast('Never completed');
      }
    };

    updateTimeSinceLast();
    const interval = setInterval(updateTimeSinceLast, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [task.last_completed]);

  // Calculate color intensity based on time since last completion
  const getTaskColor = () => {
    if (!task.last_completed) return 'rgba(255, 0, 0, 0.1)'; // Light red for never completed
    
    const last = new Date(task.last_completed);
    const now = new Date();
    const daysSince = (now - last) / (1000 * 60 * 60 * 24);
    
    // Red intensity increases with days (max at 7 days)
    const intensity = Math.min(daysSince / 7, 1);
    return `rgba(255, 0, 0, ${intensity * 0.3})`; // Max opacity 0.3
  };

  // Mock completion history for demo
  const getCompletionStats = () => {
    const history = [
      { time_since_last: 24 }, // 24 hours
      { time_since_last: 48 },
      { time_since_last: 12 },
      { time_since_last: 72 },
      { time_since_last: 36 }
    ];
    return history;
  };

  const stats = getCompletionStats();
  const avgTime = stats.reduce((acc, curr) => acc + curr.time_since_last, 0) / stats.length;

  return (
    <div 
      className="task-container" 
      style={{ backgroundColor: getTaskColor() }}
    >
      <div className="task-header">
        <div className="task-title" onClick={() => setExpanded(!expanded)}>
          <button className="expand-button">
            {expanded ? '▼' : '▶'}
          </button>
          <h3>{task.name}</h3>
        </div>
        <div className="task-meta">
          <span className="expected-time">⏱️ {task.expected_time} min</span>
          <span className="last-completed">🕒 {timeSinceLast}</span>
          <button className="complete-button" onClick={onComplete}>
            ✓ Complete
          </button>
        </div>
      </div>

      {expanded && (
        <div className="task-expanded">
          <div className="stats-section">
            <h4>Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Current streak:</span>
                <span className="stat-value">{task.current_streak}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average time between:</span>
                <span className="stat-value">{Math.round(avgTime)} hours</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Times completed:</span>
                <span className="stat-value">{stats.length}</span>
              </div>
            </div>
          </div>

          <div className="histogram-section">
            <h4>Completion History</h4>
            <div className="histogram">
              {stats.map((completion, index) => {
                const height = (completion.time_since_last / 100) * 100; // Scale to max 100px
                return (
                  <div key={index} className="histogram-bar-container">
                    <div 
                      className="histogram-bar"
                      style={{ height: `${Math.min(height, 100)}px` }}
                    >
                      <span className="histogram-value">
                        {completion.time_since_last}h
                      </span>
                    </div>
                    <span className="histogram-label">{index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Task;