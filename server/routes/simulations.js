const express = require('express');
const router = express.Router();
const store = require('../store');
const { validateRumble } = require('../utils/validate');
const { runMatchWithFrames } = require('../ml/engine');

router.get('/', async (req, res) => {
  try {
    res.json(await store.simulations.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/latest', async (req, res) => {
  try {
    res.json(await store.simulations.getLatest());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run a full match on the server (same engine as the Monte Carlo predictor), save it and
// return per-minute frames for the client to replay. Uses the saved setup unless a lineup is sent.
router.post('/run', async (req, res) => {
  try {
    const lineup = req.body?.wrestlers || (await store.setup.get())?.wrestlers;
    const { error, wrestlers } = validateRumble(lineup);
    if (error) return res.status(400).json({ error: `No valid rumble setup: ${error}` });

    const { frames, timeline, summary } = runMatchWithFrames(wrestlers);
    const saved = await store.simulations.save({
      ...summary,
      timeline: timeline.map(e => ({ minute: e.minute, text: e.text }))
    });
    res.status(201).json({ simulation: saved, frames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const sim = await store.simulations.save({
      winner: String(b.winner || '').slice(0, 80),
      matchDuration: Number(b.matchDuration) || 0,
      mostEliminations: Number(b.mostEliminations) || 0,
      mostEliminationsName: String(b.mostEliminationsName || '').slice(0, 80),
      ironMan: String(b.ironMan || '').slice(0, 80),
      ironManMinutes: Number(b.ironManMinutes) || 0,
      totalEliminations: Number(b.totalEliminations) || 0,
      timeline: (Array.isArray(b.timeline) ? b.timeline : []).slice(0, 500)
        .map(e => ({ minute: Number(e?.minute) || 0, text: String(e?.text || '').slice(0, 200) }))
    });
    res.status(201).json(sim);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
