const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const store = require('../store');
const { validateRumble } = require('../utils/validate');

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const character = line[i];
    if (character === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === ',' && !insideQuotes) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }

  values.push(value);
  return values;
}

router.get('/sample', async (req, res) => {
  try {
    const samplePath = path.resolve(__dirname, '../../dataset/royal_rumble_sample.csv');
    const csv = await fs.promises.readFile(samplePath, 'utf8');
    const [headerLine, ...dataLines] = csv.trim().split(/\r?\n/);
    const headers = parseCsvLine(headerLine);
    const sample = dataLines
      .filter(line => line.trim())
      .map(line => {
        const values = parseCsvLine(line);
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
        return {
          name: row.name,
          brand: row.brand,
          entryNumber: Number(row.entryNumber),
          winProbability: Number(row.winProbability),
          eliminationResistance: Number(row.eliminationResistance)
        };
      });

    sample.sort((a, b) => a.entryNumber - b.entryNumber);

    const entryNumbers = new Set(sample.map(w => w.entryNumber));
    if (sample.length !== 30 || entryNumbers.size !== 30 || sample.some(w => (
      !w.name || !w.brand || !Number.isInteger(w.entryNumber) ||
      w.entryNumber < 1 || w.entryNumber > 30 ||
      !Number.isFinite(w.winProbability) || !Number.isFinite(w.eliminationResistance)
    ))) {
      throw new Error('The sample dataset must contain 30 valid wrestler entries.');
    }

    res.json(sample);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    res.json(await store.setup.get());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, wrestlers } = validateRumble(req.body?.wrestlers);
    if (error) return res.status(400).json({ error });
    const setup = await store.setup.save(wrestlers);
    res.status(201).json(setup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
