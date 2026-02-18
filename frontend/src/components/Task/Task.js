import React, { useState, useEffect } from 'react';
import './Task.css';
import { formatDistance, format, parseISO } from 'date-fns';

const Task = ({ task, onComplete, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [timeSinceLast, setTimeSinceLast] = useState('');
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [updateValue, setUpdateValue] = useState('');
  const [showUpdateInput, setShowUpdateInput] = useState(false);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'

  const isTrackingItem = task.type === 'tracking-item';

  useEffect(() => {
    const updateTimeSinceLast = () => {
      if (task.last_completed) {
        const last = new Date(task.last_completed);
        const now = new Date();
        setTimeSinceLast(formatDistance(last, now, { addSuffix: true }));
      } else {
        setTimeSinceLast(isTrackingItem ? 'No updates yet' : 'Never completed');
      }
    };

    updateTimeSinceLast();
    const interval = setInterval(updateTimeSinceLast, 60000);

    // Generate mock tracking history for demo
    if (isTrackingItem) {
      generateMockHistory();
    }

    return () => clearInterval(interval);
  }, [task.last_completed, isTrackingItem]);

  const generateMockHistory = () => {
    const mockData = [];
    const now = new Date();
    
    // Generate 30 days of mock data
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      mockData.push({
        timestamp: date.toISOString(),
        value: Math.floor(Math.random() * 100) + 20, // Random values between 20-120
        unit: task.expected_time ? 'min' : 'units'
      });
    }
    setTrackingHistory(mockData);
  };

  // Calculate color intensity based on time since last update
  const getTaskColor = () => {
    if (!task.last_completed) return 'rgba(255, 0, 0, 0.1)';
    
    const last = new Date(task.last_completed);
    const now = new Date();
    const daysSince = (now - last) / (1000 * 60 * 60 * 24);
    
    const intensity = Math.min(daysSince / 7, 1);
    return `rgba(255, 0, 0, ${intensity * 0.3})`;
  };

  // Filter history based on selected time range
  const getFilteredHistory = () => {
    const now = new Date();
    let cutoff = new Date();
    
    switch(timeRange) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoff.setDate(now.getDate() - 7);
    }
    
    return trackingHistory.filter(item => parseISO(item.timestamp) >= cutoff);
  };

  // Calculate statistics for tracking items
  const getTrackingStats = () => {
    if (!isTrackingItem || trackingHistory.length === 0) return null;
    
    const values = trackingHistory.map(h => h.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const latest = values[values.length - 1];
    const trend = values.length > 1 ? values[values.length - 1] - values[values.length - 2] : 0;
    
    return { avg, max, min, latest, trend };
  };

  const stats = isTrackingItem ? getTrackingStats() : null;
  const filteredHistory = getFilteredHistory();

  const handleUpdate = () => {
    if (updateValue && !isNaN(updateValue)) {
      if (onUpdate) {
        onUpdate(task.id, parseFloat(updateValue));
      }
      setUpdateValue('');
      setShowUpdateInput(false);
    }
  };

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
          {isTrackingItem && (
            <span className="task-badge">📊 Tracking</span>
          )}
        </div>
        <div className="task-meta">
          <span className="expected-time">
            {isTrackingItem ? '🎯 Target:' : '⏱️ Expected:'} 
            {task.expected_time} {isTrackingItem ? 'units' : 'min'}
          </span>
          <span className="last-completed">
            {isTrackingItem ? '🕒' : '✓'} {timeSinceLast}
          </span>
          
          {isTrackingItem ? (
            <div className="update-section">
              {showUpdateInput ? (
                <div className="update-input-group">
                  <input
                    type="number"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    placeholder="Value"
                    className="update-input"
                    autoFocus
                  />
                  <button 
                    className="update-submit"
                    onClick={handleUpdate}
                  >
                    ✓
                  </button>
                  <button 
                    className="update-cancel"
                    onClick={() => setShowUpdateInput(false)}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button 
                  className="update-button"
                  onClick={() => setShowUpdateInput(true)}
                >
                  📝 Update
                </button>
              )}
            </div>
          ) : (
            <button className="complete-button" onClick={onComplete}>
              ✓ Complete
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="task-expanded">
          {isTrackingItem ? (
            <>
              {/* Tracking Item Statistics */}
              {stats && (
                <div className="stats-section">
                  <h4>Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Latest value:</span>
                      <span className="stat-value">{stats.latest.toFixed(1)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Average:</span>
                      <span className="stat-value">{stats.avg.toFixed(1)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Range:</span>
                      <span className="stat-value">{stats.min.toFixed(0)} - {stats.max.toFixed(0)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Trend:</span>
                      <span className={`stat-value ${stats.trend >= 0 ? 'trend-up' : 'trend-down'}`}>
                        {stats.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.trend).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Range Selector */}
              <div className="time-range-selector">
                <button 
                  className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
                  onClick={() => setTimeRange('week')}
                >
                  Week
                </button>
                <button 
                  className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
                  onClick={() => setTimeRange('month')}
                >
                  Month
                </button>
                <button 
                  className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
                  onClick={() => setTimeRange('year')}
                >
                  Year
                </button>
              </div>

              {/* Line Graph */}
              <div className="graph-section">
                <h4>Value Evolution</h4>
                <div className="line-graph">
                  <svg viewBox="0 0 800 300" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 1, 2, 3].map(i => (
                      <line
                        key={`grid-${i}`}
                        x1="0"
                        y1={75 * i}
                        x2="800"
                        y2={75 * i}
                        stroke="#e8d5b5"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                      />
                    ))}
                    
                    {/* Line path */}
                    {filteredHistory.length > 1 && (
                      <>
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8b6b4d" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#8b6b4d" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Area under line */}
                        <path
                          d={`
                            M 0,300 
                            ${filteredHistory.map((point, i) => {
                              const x = (i / (filteredHistory.length - 1)) * 800;
                              const y = 300 - ((point.value - 20) / 120) * 250;
                              return `L ${x},${y}`;
                            }).join(' ')}
                            L 800,300
                            Z
                          `}
                          fill="url(#gradient)"
                        />
                        
                        {/* Main line */}
                        <path
                          d={filteredHistory.map((point, i) => {
                            const x = (i / (filteredHistory.length - 1)) * 800;
                            const y = 300 - ((point.value - 20) / 120) * 250;
                            return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#5c3e2d"
                          strokeWidth="2"
                        />
                        
                        {/* Data points */}
                        {filteredHistory.map((point, i) => {
                          const x = (i / (filteredHistory.length - 1)) * 800;
                          const y = 300 - ((point.value - 20) / 120) * 250;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#fffcf5"
                              stroke="#5c3e2d"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </>
                    )}
                  </svg>
                </div>

                {/* X-axis labels */}
                <div className="graph-labels">
                  {filteredHistory.length > 0 && 
                    filteredHistory
                      .filter((_, i) => i % Math.ceil(filteredHistory.length / 5) === 0)
                      .map((point, i) => (
                        <span key={i} className="graph-label">
                          {format(parseISO(point.timestamp), 'MMM d')}
                        </span>
                      ))
                  }
                </div>
              </div>
            </>
          ) : (
            /* Original task histogram */
            <>
              <div className="stats-section">
                <h4>Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Current streak:</span>
                    <span className="stat-value">{task.current_streak}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Times completed:</span>
                    <span className="stat-value">{Math.floor(Math.random() * 20) + 1}</span>
                  </div>
                </div>
              </div>

              <div className="histogram-section">
                <h4>Completion History</h4>
                <div className="histogram">
                  {[...Array(10)].map((_, index) => {
                    const height = Math.random() * 100;
                    return (
                      <div key={index} className="histogram-bar-container">
                        <div 
                          className="histogram-bar"
                          style={{ height: `${height}px` }}
                        >
                          <span className="histogram-value">
                            {Math.round(height)}h
                          </span>
                        </div>
                        <span className="histogram-label">{index + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Task;