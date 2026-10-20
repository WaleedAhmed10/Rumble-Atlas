import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getWrestlers, getSetup, saveSetup, getSampleRumble } from '../api';

// Put each saved wrestler in the slot matching its entry number (not its array position)
function slotsFromLineup(lineup) {
  const slots = Array(30).fill(null);
  lineup.forEach(w => {
    const i = Number(w.entryNumber) - 1;
    if (i >= 0 && i < 30) slots[i] = w;
  });
  return slots;
}

export default function Builder() {
  const navigate = useNavigate();
  const [allWrestlers, setAllWrestlers] = useState([]);
  const [slots, setSlots] = useState(Array(30).fill(null));
  const [search, setSearch] = useState('');
  const [activeSlot, setActiveSlot] = useState(null);
  const [error, setError] = useState('');
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleMessage, setSampleMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const wrestlers = await getWrestlers();
      setAllWrestlers(wrestlers);
      const setup = await getSetup();
      if (setup?.wrestlers?.length === 30) setSlots(slotsFromLineup(setup.wrestlers));
    } catch (err) {
      setError(err.message);
    }
  }

  function assignToSlot(slotIndex, wrestler) {
    const newSlots = slots.map(s => (s && s.name === wrestler.name ? null : s)); // a wrestler can only be in one slot
    newSlots[slotIndex] = {
      wrestlerId: wrestler._id,
      name: wrestler.name,
      winProbability: wrestler.winProbability,
      eliminationResistance: wrestler.eliminationResistance,
      brand: wrestler.brand,
      entryNumber: slotIndex + 1
    };
    setSlots(newSlots);
    setActiveSlot(null);
  }

  function randomize() {
    if (allWrestlers.length < 30) {
      alert(`Need at least 30 wrestlers. You have ${allWrestlers.length}. Add more wrestlers first!`);
      return;
    }
    const shuffled = [...allWrestlers];
    for (let i = shuffled.length - 1; i > 0; i--) { // Fisher-Yates (sort(() => Math.random() - 0.5) is biased)
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    shuffled.length = 30;
    setSlots(shuffled.map((w, i) => ({
      wrestlerId: w._id,
      name: w.name,
      winProbability: w.winProbability,
      eliminationResistance: w.eliminationResistance,
      brand: w.brand,
      entryNumber: i + 1
    })));
    alert('Random entries assigned!');
  }

  function clearAll() {
    if (confirm('Clear all slot assignments?')) setSlots(Array(30).fill(null));
  }

  async function handleSave() {
    const filled = slots.filter(s => s !== null);
    if (filled.length !== 30) {
      alert(`Need ${30 - filled.length} more wrestlers!`);
      return;
    }
    try {
      const names = new Set(filled.map(s => s.name.toLowerCase()));
      if (names.size !== 30) { alert('The same wrestler is in more than one slot.'); return; }
      await saveSetup(filled);
      alert('Rumble setup saved! Click Simulate to run the match.');
    } catch (err) {
      alert(err.message);
    }
  }

  async function loadSampleRumble() {
    setSampleLoading(true);
    setSampleMessage('');
    setError('');
    try {
      const sample = await getSampleRumble();
      await saveSetup(sample);
      setSlots(slotsFromLineup(sample));
      setActiveSlot(null);
      setSampleMessage('Sample Rumble loaded and saved. Open AI Predict to try both prediction models.');
    } catch (err) {
      setError(`Could not load the sample Rumble: ${err.message}`);
    } finally {
      setSampleLoading(false);
    }
  }

  const filledCount = slots.filter(s => s !== null).length;
  const filtered = allWrestlers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.brand && w.brand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <h1 className="page-title">Royal Rumble Builder</h1>
      <p style={{ textAlign: 'center' }}>Select 30 wrestlers and assign entry numbers 1-30</p>
      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ maxWidth: '760px', margin: '0 auto 20px', textAlign: 'center' }}>
        <h3>New to predictions?</h3>
        <p>Load the 30-entry sample lineup to try the prediction tools right away. This saves it as your current setup without changing your wrestler database.</p>
        <button className="btn btn-secondary" onClick={loadSampleRumble} disabled={sampleLoading}>
          {sampleLoading ? 'Loading Sample...' : 'Load Sample Rumble'}
        </button>
        {sampleMessage && <p role="status" style={{ color: '#4CAF50', marginBottom: 0 }}>{sampleMessage}</p>}
        {sampleMessage && <button className="btn" onClick={() => navigate('/predictions')}>Open AI Predictions</button>}
      </div>

      <div className="builder-container">
        <div className="database-panel">
          <h3>Your Wrestlers</h3>
          <input
            className="search-box"
            placeholder="🔍 Search wrestlers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {allWrestlers.length === 0 ? (
            <p>No wrestlers found. Go to Wrestlers page first!</p>
          ) : (
            filtered.map(w => (
              <div
                key={w._id}
                className={`wrestler-item ${activeSlot === null ? 'disabled' : ''}`}
                onClick={() => {
                  if (activeSlot !== null) assignToSlot(activeSlot, w);
                  else alert('Click on a slot first, then click a wrestler to assign!');
                }}
              >
                <strong>{w.name}</strong>
                <div style={{ fontSize: '12px', color: '#aaa' }}>Win: {w.winProbability}% | {w.brand || ''}</div>
              </div>
            ))
          )}
        </div>

        <div className="rumble-panel">
          <h3>Royal Rumble Slots (30 Required)</h3>
          <div className="ringslots">
            {slots.map((slot, i) => (
              <div
                key={i}
                className={`slot ${slot ? 'filled' : ''} ${activeSlot === i ? 'active' : ''}`}
                onClick={() => setActiveSlot(i)}
              >
                <div className="slot-number">Entry #{i + 1}</div>
                <div className="slot-content">{slot ? slot.name : ''}</div>
                <div className="slot-status" style={{ color: slot ? '#4CAF50' : '#888' }}>
                  {slot ? 'Filled' : 'Empty'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="builder-controls">
        <button className="btn" onClick={randomize}>🎲 Randomize Entries</button>
        <button className="btn" onClick={clearAll}>🗑️ Clear All</button>
        <button className="btn" onClick={handleSave}>💾 Save Setup</button>
        {filledCount === 30 ? (
          <Link to="/simulate" className="btn">▶️ Simulate Rumble</Link>
        ) : (
          <span className="btn" style={{ opacity: 0.5 }}>▶️ Simulate Rumble</span>
        )}
      </div>

      {activeSlot !== null && (
        <p className="slot-hint">Click on a wrestler to assign to Entry #{activeSlot + 1}</p>
      )}

      {filledCount > 0 && (
        <div className="slot-counter">{filledCount}/30 Selected</div>
      )}
    </>
  );
}
