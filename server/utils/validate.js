// Input validation / sanitising shared by all routes.

const MAX_NAME = 80;

function num(value, fallback, min, max) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// Whitelist + clamp a wrestler coming from the client. Returns null if it has no name.
function cleanWrestler(w) {
  if (!w || typeof w !== 'object') return null;
  const name = String(w.name ?? '').trim().slice(0, MAX_NAME);
  if (!name) return null;
  return {
    name,
    winProbability: num(w.winProbability, 5, 0, 100),
    eliminationResistance: num(w.eliminationResistance, 1.0, 0.1, 5),
    brand: (String(w.brand ?? 'Unknown').trim().slice(0, 40)) || 'Unknown'
  };
}

// Validate a 30-entry rumble lineup. Returns { error } or { wrestlers } (cleaned, sorted by entry).
function validateRumble(list) {
  if (!Array.isArray(list) || list.length !== 30) {
    return { error: 'Need exactly 30 wrestlers with entry numbers' };
  }
  const seenEntries = new Set();
  const seenNames = new Set();
  const out = [];
  for (const raw of list) {
    const base = cleanWrestler(raw);
    if (!base) return { error: 'Every wrestler needs a name' };
    const entryNumber = Number(raw.entryNumber);
    if (!Number.isInteger(entryNumber) || entryNumber < 1 || entryNumber > 30) {
      return { error: `${base.name} has an invalid entry number (must be 1-30)` };
    }
    if (seenEntries.has(entryNumber)) return { error: `Entry #${entryNumber} is used more than once` };
    const key = base.name.toLowerCase();
    if (seenNames.has(key)) return { error: `${base.name} appears more than once in the lineup` };
    seenEntries.add(entryNumber);
    seenNames.add(key);
    const item = { ...base, entryNumber };
    if (raw.wrestlerId != null) item.wrestlerId = String(raw.wrestlerId);
    out.push(item);
  }
  out.sort((a, b) => a.entryNumber - b.entryNumber);
  return { wrestlers: out };
}

module.exports = { cleanWrestler, validateRumble };
