import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSetup, predictWinners, monteCarloPredict } from '../api';

function PredictionList({ predictions, title }) {
  if (!predictions) return null;
  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <h3>{title}</h3>
      {predictions.slice(0, 10).map((p, i) => (
        <div key={p.name} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px', borderBottom: '1px solid #333',
          background: i === 0 ? '#1a1a00' : 'transparent'
        }}>
          <span>
            {i === 0 && '🏆 '}{i + 1}. {p.name}
            <small style={{ color: '#888', marginLeft: '10px' }}>#{p.entryNumber} | {p.brand}</small>
          </span>
          <span style={{ color: i === 0 ? 'gold' : '#c00', fontWeight: 'bold' }}>{p.winPercent}%</span>
        </div>
      ))}
    </div>
  );
}

export default function Predictions() {
  const navigate = useNavigate();
  const [wrestlers, setWrestlers] = useState(null);
  const [quickResult, setQuickResult] = useState(null);
  const [mcResult, setMcResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSetup()
      .then(setup => {
        if (setup?.wrestlers?.length === 30) {
          setWrestlers(setup.wrestlers);
        } else {
          setError('Build a full 30-wrestler rumble setup first!');
        }
      })
      .catch(err => setError(err.message));
  }, []);

  async function runQuickPredict() {
    setLoading(true);
    try {
      const result = await predictWinners(wrestlers);
      setQuickResult(result);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function runMonteCarlo() {
    setLoading(true);
    try {
      const result = await monteCarloPredict(wrestlers, 500);
      setMcResult(result);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <>
        <div className="error-msg">
          <p>{error}</p>
          <button className="btn" onClick={() => navigate('/builder')}>Go to Builder and Load Sample</button>
        </div>
        <div className="card" style={{ maxWidth: '700px', margin: '20px auto', textAlign: 'center' }}>
          <h3>How predictions work</h3>
          <p>Build a 30-entry lineup first. Quick AI Predict ranks wrestlers using win probability, elimination resistance, and entry position. Monte Carlo compares win rates across 500 randomized simulations.</p>
        </div>
      </>
    );
  }

  if (!wrestlers) return <p style={{ textAlign: 'center' }}>Loading...</p>;

  return (
    <>
      <h1 className="page-title">AI Predictions</h1>
      <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 30px' }}>
        Our ML engine uses wrestler stats (win probability, elimination resistance) and entry position
        to predict who is most likely to win the Royal Rumble. Load the sample lineup from the Builder to try it without creating your own roster.
      </p>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={runQuickPredict} disabled={loading}>
          Quick AI Predict
        </button>
        <button className="btn btn-secondary" onClick={runMonteCarlo} disabled={loading}>
          Monte Carlo (500 sims)
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', marginTop: '20px' }}>Running AI analysis...</p>}

      {quickResult && (
        <>
          <div className="card" style={{ marginTop: '20px', border: '2px solid gold', textAlign: 'center' }}>
            <h3>AI Top Pick (Weighted Scoring)</h3>
            <p style={{ fontSize: '36px', color: 'gold' }}>{quickResult.topPick.name}</p>
            <p>{quickResult.topPick.winPercent}% predicted win chance</p>
            <p style={{ color: '#aaa', fontStyle: 'italic' }}>{quickResult.insight}</p>
          </div>
          <PredictionList predictions={quickResult.predictions} title="Full Rankings - Weighted Model" />
        </>
      )}

      {mcResult && (
        <>
          <div className="card" style={{ marginTop: '20px', border: '2px solid #4CAF50', textAlign: 'center' }}>
            <h3>Monte Carlo Top Pick ({mcResult.runs} simulations)</h3>
            <p style={{ fontSize: '36px', color: '#4CAF50' }}>{mcResult.topPick.name}</p>
            <p>{mcResult.topPick.winPercent}% win rate across simulations</p>
            <p style={{ color: '#aaa', fontStyle: 'italic' }}>{mcResult.insight}</p>
          </div>
          <PredictionList predictions={mcResult.predictions} title="Full Rankings - Monte Carlo Model" />
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button className="btn" onClick={() => navigate('/simulate')}>Run Live Simulation</button>
      </div>
    </>
  );
}
