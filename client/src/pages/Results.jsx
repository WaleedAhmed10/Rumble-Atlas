import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestSimulation } from '../api';

export default function Results() {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestSimulation()
      .then(data => { setResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function shareResults() {
    if (!results) return;
    const text = `🏆 Royal Rumble Winner: ${results.winner}! ${results.mostEliminations} eliminations! Can you beat my prediction? 🎪`;
    if (navigator.share) {
      navigator.share({ title: 'Royal Rumble Results', text, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => alert('Results copied to clipboard! Share with your friends!'))
        .catch(() => alert(text));
    } else {
      alert(text);
    }
  }

  function formatTime(m) {
    const mins = Math.floor(m);
    const secs = Math.floor((m % 1) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (loading) return <p style={{ textAlign: 'center' }}>Loading...</p>;

  if (!results) {
    return (
      <div className="no-results">
        <h2>No Results Found</h2>
        <p>Run a Royal Rumble simulation first!</p>
        <button className="btn" onClick={() => navigate('/builder')}>Go to Builder</button>
      </div>
    );
  }

  return (
    <>
      <div className="winner-banner">
        <h2>🏆 ROYAL RUMBLE WINNER 🏆</h2>
        <div className="winner-name">{results.winner}</div>
        <p>Match Duration: {Math.floor(results.matchDuration)} minutes</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>⭐ Most Eliminations</h3>
          <div className="stat-number">{results.mostEliminations}</div>
          <p>by {results.mostEliminationsName}</p>
        </div>
        <div className="stat-card">
          <h3>⏳ Iron Man</h3>
          <div className="stat-number">{results.ironMan}</div>
          <p>Longest time in ring{results.ironManMinutes ? ` (${results.ironManMinutes} min)` : ''}</p>
        </div>
        <div className="stat-card">
          <h3>📊 Total Eliminations</h3>
          <div className="stat-number">{results.totalEliminations ?? 29}</div>
          <p>out of 29</p>
        </div>
      </div>

      <div className="timeline">
        <h3>Elimination Timeline</h3>
        {(results.timeline || []).length === 0 ? (
          <p>No timeline data available</p>
        ) : (
          results.timeline.map((e, i) => (
            <div key={i} className="timeline-item">
              <span className="event-time">{formatTime(e.minute)}</span>
              <span>{e.text}</span>
            </div>
          ))
        )}
      </div>

      <div className="action-buttons">
        <button className="btn" onClick={shareResults}>📤 Share Results</button>
        <button className="btn" onClick={() => navigate('/simulate')}>🔄 Run Again</button>
        <button className="btn" onClick={() => navigate('/builder')}>🔨 Edit Rumble</button>
        <button className="btn" onClick={() => navigate('/')}>🏠 Home</button>
      </div>
    </>
  );
}
