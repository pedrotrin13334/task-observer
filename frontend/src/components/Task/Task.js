import React, { useState, useEffect } from 'react';
import './Task.css';
import { formatDistance } from 'date-fns';
import Plot from 'react-plotly.js';

const Task = ({ task, onComplete, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [timeSince, setTimeSince] = useState('');
  const [updateVal, setUpdateVal] = useState('');
  const [showUpdate, setShowUpdate] = useState(false);
  const [range, setRange] = useState('week');
  const [width, setWidth] = useState(600);

  const isTracking = task.type === 'tracking-item';

  // Mock data
  const history = Array(20).fill().map((_, i) => ({
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    value: Math.random() * 100,
    hours: Math.random() * 72
  }));

  useEffect(() => {
    const updateTime = () => {
      if (task.last_completed) {
        setTimeSince(formatDistance(new Date(task.last_completed), new Date(), { addSuffix: true }));
      } else {
        setTimeSince(isTracking ? 'Never updated' : 'Never completed');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [task.last_completed]);

  const filtered = history.filter(h => 
    new Date(h.timestamp) > new Date(Date.now() - ({week:7, month:30, year:365}[range] * 86400000))
  );

  const graphLayout = { 
    width, height: 220, 
    margin: { l: 40, r: 10, t: 25, b: 35 },
    paper_bgcolor: 'rgba(0,0,0,0)', 
    plot_bgcolor: 'rgba(248,241,228,0.3)',
    font: { family: 'Source Sans 3', size: 9, color: '#5c3e2d' },
    xaxis: { gridcolor: '#e8d5b5', linecolor: '#b89b7b' },
    yaxis: { gridcolor: '#e8d5b5', linecolor: '#b89b7b' }
  };

  const daysSince = task.last_completed 
    ? (Date.now() - new Date(task.last_completed)) / (86400000)
    : 7;
  const redIntensity = Math.min(daysSince / 7, 0.25);

  return (
    <div className="task" style={{ backgroundColor: `rgba(255, 0, 0, ${redIntensity})` }}>
      <div className="task-header" onClick={() => setExpanded(!expanded)}>
        <span className="expand">{expanded ? '▼' : '▶'}</span>
        <h3>{task.name}</h3>
        {isTracking && <span className="badge">Tracking Item</span>}
        <div className="meta">
          <span className="time-badge">🕒 {timeSince}</span>
          <span className="time-badge"> {isTracking? 'Max: ' : 'Goal: '}: {task.expected_time}{isTracking ? ' items': ' days'}</span>
          {!isTracking ? (
            <button className="action-btn" onClick={(e) => { e.stopPropagation(); onComplete(); }}>Complete  ✓</button>
          ) : showUpdate ? (
            <div className="update-group" onClick={(e) => e.stopPropagation()}>
              <input value={updateVal} onChange={(e) => setUpdateVal(e.target.value)} type="number" />
              <button className="action-btn small" onClick={() => { onUpdate?.(task.id, parseFloat(updateVal)); setShowUpdate(false); }}>✓</button>
              <button className="action-btn small" onClick={() => setShowUpdate(false)}>✕</button>
            </div>
          ) : (
            <button className="action-btn" onClick={(e) => { e.stopPropagation(); setShowUpdate(true); }}>Update!</button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="expanded">
          <div className="stats-row">
            {isTracking ? (
              <>
                <span>Latest: <strong>{filtered[0]?.value.toFixed(1) || 'N/A'}</strong></span>
                <span>Average: <strong>{(filtered.reduce((a,b) => a + b.value, 0) / filtered.length).toFixed(1) || 'N/A'}</strong></span>
              </>
            ) : (
              <>
                <span>Streak: <strong>{task.current_streak}</strong></span>
                <span>Completions: <strong>{filtered.length}</strong></span>
                <span>Avg interval: <strong>{(filtered.reduce((a,b) => a + b.hours, 0) / filtered.length).toFixed(1)}h</strong></span>
              </>
            )}
          </div>

          <div className="range-selector">
            {['week','month','year'].map(r => (
              <button key={r} className={range===r?'active':''} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>

          <div id={`graph-${task.id}`}>
            {isTracking ? (
              <Plot 
                data={[{
                  x: filtered.map(h => h.timestamp),
                  y: filtered.map(h => h.value),
                  type: 'scatter', mode: 'lines+markers',
                  line: { color: '#5c3e2d', width: 2 },
                  marker: { color: '#8b6b4d', size: 5 }
                }]}
                layout={graphLayout}
              />
            ) : (
                <Plot 
                    data={[{
                        x: filtered.map(h => h.hours),
                        type: 'histogram',
                        name: 'Completion intervals',
                        marker: { 
                        color: '#5c3e2d',
                        line: { color: '#f0e2c5', width: 1 }
                        },
                        opacity: 0.8,
                        hovertemplate: '<b>%{x:.1f} hours</b><br>Count: %{y}<extra></extra>'
                    }]}
                    layout={{
                        ...graphLayout,
                        xaxis: { 
                        ...graphLayout.xaxis, 
                        title: { text: 'Hours between completions', font: { size: 15 } }
                        },
                        yaxis: { 
                        ...graphLayout.yaxis, 
                        title: { text: 'Frequency', font: { size: 15 } }
                        },
                        bargap: 0.1
                    }}
                />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Task;