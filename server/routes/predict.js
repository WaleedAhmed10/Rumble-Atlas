const express = require('express');
const router = express.Router();
const { predictWinners, monteCarloPredict } = require('../ml/predictor');
const { validateRumble } = require('../utils/validate');

// POST quick AI prediction (weighted scoring)
router.post('/', (req, res) => {
  try {
    const { error, wrestlers } = validateRumble(req.body?.wrestlers);
    if (error) return res.status(400).json({ error });
    res.json(predictWinners(wrestlers));
  } catch (err) {
    console.error(err), res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST Monte Carlo AI prediction (runs many simulations)
router.post('/monte-carlo', (req, res) => {
  try {
    const { error, wrestlers } = validateRumble(req.body?.wrestlers);
    if (error) return res.status(400).json({ error });
    const requested = parseInt(req.body?.runs, 10);
    const runs = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 2000) : 500;
    res.json(monteCarloPredict(wrestlers, runs));
  } catch (err) {
    console.error(err), res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
