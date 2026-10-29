import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSimulations, getSetup } from '../api';
import { IMAGES } from '../constants/images';

export default function Home() {
  const navigate = useNavigate();
  const [recentSims, setRecentSims] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getSimulations()
      .then(setRecentSims)
      .catch(() => setError('Could not load simulations. Is the server running?'));
  }, []);

  async function quickSimulate() {
    try {
      const setup = await getSetup();
      if (setup && setup.wrestlers?.length === 30) {
        navigate('/simulate');
      } else {
        alert('Please build a Royal Rumble setup first!');
        navigate('/builder');
      }
    } catch {
      alert('Server not connected. Start the backend first!');
    }
  }

  return (
    <>
      <div className="hero">
        <h1>Rumble Atlas</h1>
        <p>Who will headline WrestleMania? Make YOUR predictions!</p>
        <div className="cta-buttons">
          <button className="btn btn-primary" onClick={() => navigate('/builder')}>Build Rumble</button>
          <button className="btn btn-secondary" onClick={quickSimulate}>Quick Simulate</button>
          <button className="btn btn-secondary" onClick={() => navigate('/predictions')}>AI Predict</button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <section className="card" style={{ maxWidth: '900px', margin: '0 auto 40px' }}>
        <h2 style={{ textAlign: 'center' }}>How to make a prediction</h2>
        <ol style={{ lineHeight: 1.8 }}>
          <li>Build a 30-wrestler lineup and choose entry numbers, or load the sample lineup in the Builder.</li>
          <li>Open <strong>AI Predict</strong> to see win chances based on wrestler stats and entry position.</li>
          <li>Choose <strong>Quick AI Predict</strong> for weighted rankings or <strong>Monte Carlo</strong> to compare results from 500 simulated rumbles.</li>
        </ol>
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/builder')}>Try the Sample Lineup</button>
        </div>
      </section>

      <h2 className="section-title">Features</h2>
      <div className="features">
        <div className="feature-card">
          <img src={IMAGES.buildRoster} alt="Build Roster" className="feature-img" />
          <h3>Build Roster</h3>
          <p>Create your wrestler database with custom win probabilities</p>
        </div>
        <div className="feature-card">
          <img src={IMAGES.aiPredictions} alt="AI Predictions" className="feature-img" />
          <h3>AI Predictions</h3>
          <p>ML-powered win probability using stats and Monte Carlo</p>
        </div>
        <div className="feature-card">
          <img src={IMAGES.runSimulation} alt="Run Simulation" className="feature-img" />
          <h3>Run Simulation</h3>
          <p>Watch the Royal Rumble unfold minute by minute</p>
        </div>
        <div className="feature-card">
          <img src={IMAGES.seeResults} alt="See Results" className="feature-img" />
          <h3>See Results</h3>
          <p>Analyze winners, eliminations, and statistics</p>
        </div>
      </div>

      <h2 className="section-title">Recent Simulations</h2>
      <div className="simulations-grid">
        {recentSims.length === 0 ? (
          <div className="sim-card">
            <h3>No Simulations Yet</h3>
            <p>Run your first Royal Rumble simulation!</p>
            <button className="btn" onClick={() => navigate('/builder')}>Start Building</button>
          </div>
        ) : (
          recentSims.slice(0, 3).map((sim, i) => (
            <div key={sim._id || i} className="sim-card">
              <h3>🏆 {sim.winner}</h3>
              <p>Duration: {Math.floor(sim.matchDuration)} min</p>
              <p>Eliminations: {sim.mostEliminations}</p>
              <p><small>{new Date(sim.createdAt).toLocaleString()}</small></p>
              <button className="btn" onClick={() => navigate('/results')}>View Results</button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
