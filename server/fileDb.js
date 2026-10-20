const fs = require('fs');
const path = require('path');
const DEFAULT_WRESTLERS = require('./data/defaultWrestlers');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function readDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial = { wrestlers: DEFAULT_WRESTLERS.map((w, i) => ({ ...w, _id: String(i + 1) })), setups: [], simulations: [] };
    writeDB(initial);
    return initial;
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { wrestlers: [], setups: [], simulations: [], ...db };
  } catch (err) {
    // Corrupt db.json: keep a backup and start fresh instead of crashing every request
    console.error('db.json is unreadable, resetting it:', err.message);
    try { fs.renameSync(DB_FILE, `${DB_FILE}.corrupt-${Date.now()}`); } catch { /* ignore */ }
    const initial = { wrestlers: DEFAULT_WRESTLERS.map((w, i) => ({ ...w, _id: String(i + 1) })), setups: [], simulations: [] };
    writeDB(initial);
    return initial;
  }
}

function writeDB(data) {
  // write to a temp file then rename so a crash mid-write can't corrupt the database
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// --- Wrestlers ---
function getWrestlers() {
  return readDB().wrestlers.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function addWrestler(data) {
  const db = readDB();
  const wrestler = { ...data, _id: newId() };
  db.wrestlers.push(wrestler);
  writeDB(db);
  return wrestler;
}

function updateWrestler(id, data) {
  const db = readDB();
  const idx = db.wrestlers.findIndex(w => w._id === id);
  if (idx === -1) return null;
  db.wrestlers[idx] = { ...db.wrestlers[idx], ...data, _id: db.wrestlers[idx]._id };
  writeDB(db);
  return db.wrestlers[idx];
}

function deleteWrestler(id) {
  const db = readDB();
  const before = db.wrestlers.length;
  db.wrestlers = db.wrestlers.filter(w => w._id !== id);
  writeDB(db);
  return db.wrestlers.length !== before;
}

function resetWrestlers() {
  const db = readDB();
  db.wrestlers = DEFAULT_WRESTLERS.map((w, i) => ({ ...w, _id: String(i + 1) }));
  writeDB(db);
  return db.wrestlers;
}

function importWrestlers(wrestlers) {
  const db = readDB();
  db.wrestlers = wrestlers.map(w => ({ ...w, _id: newId() }));
  writeDB(db);
  return db.wrestlers;
}

// --- Setup ---
function getSetup() {
  const db = readDB();
  return db.setups.length > 0 ? db.setups[db.setups.length - 1] : null;
}

function saveSetup(wrestlers) {
  const db = readDB();
  const setup = { _id: newId(), wrestlers, createdAt: new Date().toISOString() };
  db.setups.push(setup);
  if (db.setups.length > 20) db.setups = db.setups.slice(-20);
  writeDB(db);
  return setup;
}

// --- Simulations ---
function getSimulations() {
  return readDB().simulations.slice().reverse().slice(0, 10);
}

function getLatestSimulation() {
  const sims = readDB().simulations;
  return sims.length > 0 ? sims[sims.length - 1] : null;
}

function saveSimulation(data) {
  const db = readDB();
  const sim = { _id: newId(), ...data, createdAt: new Date().toISOString() };
  db.simulations.push(sim);
  if (db.simulations.length > 50) db.simulations = db.simulations.slice(-50); // keep the file small
  writeDB(db);
  return sim;
}

module.exports = {
  getWrestlers, addWrestler, updateWrestler, deleteWrestler,
  resetWrestlers, importWrestlers,
  getSetup, saveSetup,
  getSimulations, getLatestSimulation, saveSimulation
};
