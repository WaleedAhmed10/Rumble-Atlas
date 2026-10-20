import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSetup, runSimulation } from '../api';

// The match itself is computed on the server (same engine as the Monte Carlo predictor).
// This page replays the per-minute frames so you can watch it unfold.
export default function Simulate() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState(null);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [minute, setMinute] = useState(0);
  const [inRing, setInRing] = useState(0);
  const [eliminatedCount, setEliminatedCount] = useState(0);
  const [timeline, setTimeline] = useState([{ minute: 0, text: 'Royal Rumble begins!' }]);
  const [winner, setWinner] = useState(null);
  const [complete, setComplete] = useState(false);

  const framesRef = useRef([]);
  const indexRef = useRef(0);
  const resultRef = useRef(null);
  const intervalRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    getSetup()
      .then(data => {
        if (!data || data.wrestlers?.length !== 30) {
          setError('No rumble setup found! Please build a Royal Rumble first.');
        } else {
          setSetup(data);
        }
      })
      .catch(err => setError(err.message));
    return () => clearInterval(intervalRef.current);
  }, []);

  // keep the newest event in view
  useEffect(() => {
    const el = timelineRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [timeline]);

  function playFrame() {
    const frame = framesRef.current[indexRef.current];
    if (!frame) return;
    indexRef.current += 1;
    setMinute(frame.minute);
    setInRing(frame.inRing);
    setEliminatedCount(frame.eliminated);
    if (frame.events.length > 0) {
      setTimeline(prev => [...prev, ...frame.events.map(e => ({ minute: e.minute, text: e.text }))]);
    }
    if (indexRef.current >= framesRef.current.length) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
      setWinner({ name: resultRef.current.winner });
      setComplete(true);
    }
  }

  function runLoop(s = speed) {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(playFrame, 1000 / s);
  }

  async function start() {
    if (!setup || isRunning || starting) return;
    setStarting(true);
    setError('');
    try {
      const { simulation, frames } = await runSimulation();
      framesRef.current = frames;
      resultRef.current = simulation;
      indexRef.current = 0;
      setMinute(0);
      setInRing(0);
      setEliminatedCount(0);
      setWinner(null);
      setComplete(false);
      setTimeline([{ minute: 0, text: 'Royal Rumble begins!' }]);
      setIsRunning(true);
      runLoop();
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  function togglePause() {
    if (isRunning) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
    } else if (framesRef.current.length > 0 && !complete) {
      setIsRunning(true);
      runLoop();
    }
  }

  function toggleSpeed() {
    const newSpeed = speed === 1 ? 3 : 1;
    setSpeed(newSpeed);
    if (isRunning) runLoop(newSpeed);
  }

  function formatTime(m) {
    const mins = Math.floor(m);
    const secs = Math.floor((m % 1) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (error && !setup) {
    return (
      <div className="error-msg">
        <p>{error}</p>
        <button className="btn" onClick={() => navigate('/builder')}>Go to Builder</button>
      </div>
    );
  }

  if (!setup) return <p style={{ textAlign: 'center' }}>Loading setup...</p>;

  const started = framesRef.current.length > 0;

  return (
    <>
      <h1 className="page-title">Royal Rumble Simulation</h1>
      {error && <div className="error-msg">{error}</div>}

      <div className="controls">
        <button className="btn" onClick={start} disabled={isRunning || starting}>
          {starting ? 'Starting...' : complete ? '🔄 Run Again' : '▶️ Start Simulation'}
        </button>
        <button className="btn" onClick={togglePause} disabled={!started || complete}>
          {isRunning ? '⏸️ Pause' : '▶️ Resume'}
        </button>
        <button className="btn" onClick={toggleSpeed}>⚡ Speed: {speed}x</button>
        <button className="btn" disabled={!complete} onClick={() => navigate('/results')}>📊 View Results</button>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h3>⏱️ Match Time</h3>
          <p>{formatTime(minute)}</p>
        </div>
        <div className="stat-card">
          <h3>👥 In Ring</h3>
          <p>{inRing}</p>
        </div>
        <div className="stat-card">
          <h3>❌ Eliminated</h3>
          <p>{eliminatedCount}/29</p>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(eliminatedCount / 29) * 100}%` }} />
      </div>

      {winner && (
        <div className="winner-display">
          <h2>🏆 ROYAL RUMBLE WINNER 🏆</h2>
          <div className="winner-name">{winner.name}</div>
          <button className="btn" onClick={() => navigate('/results')}>📊 View Detailed Results</button>
        </div>
      )}

      <div className="timeline" ref={timelineRef}>
        <h3>Elimination Timeline</h3>
        {timeline.map((e, i) => (
          <div key={i} className="timeline-event">
            <span className="event-time">{formatTime(e.minute)}</span>
            <span>{e.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}
