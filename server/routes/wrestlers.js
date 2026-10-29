const express = require('express');
const router = express.Router();
const store = require('../store');
const { sanitizeWrestlers } = require('../utils/sanitizeWrestlers');
const { cleanWrestler } = require('../utils/validate');

router.get('/', async (req, res) => {
  try {
    res.json(await store.wrestlers.getAll(req.user.id));
  } catch (err) {
    console.error(err), res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = cleanWrestler(req.body);
    if (!data) return res.status(400).json({ error: 'A wrestler needs a name' });
    const wrestler = await store.wrestlers.add(req.user.id, data);
    res.status(201).json(wrestler);
  } catch (err) {
    console.error(err), res.status(400).json({ error: 'Invalid request' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = cleanWrestler(req.body);
    if (!data) return res.status(400).json({ error: 'A wrestler needs a name' });
    const wrestler = await store.wrestlers.update(req.user.id, req.params.id, data);
    if (!wrestler) return res.status(404).json({ error: 'Wrestler not found' });
    res.json(wrestler);
  } catch (err) {
    console.error(err), res.status(400).json({ error: 'Invalid request' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const removed = await store.wrestlers.remove(req.user.id, req.params.id);
    if (removed === false || removed === null) return res.status(404).json({ error: 'Wrestler not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err), res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    res.json(await store.wrestlers.reset(req.user.id));
  } catch (err) {
    console.error(err), res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { wrestlers } = req.body;
    if (!Array.isArray(wrestlers)) {
      return res.status(400).json({ error: 'wrestlers must be an array' });
    }

    const cleaned = sanitizeWrestlers(wrestlers);
    if (cleaned.length === 0 && wrestlers.length > 0) {
      return res.status(400).json({ error: 'No valid wrestlers found. Each wrestler needs a name.' });
    }

    res.json(await store.wrestlers.import(req.user.id, cleaned.slice(0, 500)));
  } catch (err) {
    console.error(err), res.status(400).json({ error: 'Invalid request' });
  }
});

router.get('/export/all', async (req, res) => {
  try {
    res.json(await store.wrestlers.getAll(req.user.id));
  } catch (err) {
    console.error(err), res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
