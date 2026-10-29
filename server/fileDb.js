const fs = require('fs');
const path = require('path');
const DEFAULT_WRESTLERS = require('./data/defaultWrestlers');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Every wrestler / setup / simulation belongs to a user (userId), so accounts never see each other's data.
function emptyDB() {
  return { users: [], wrestlers: [], setups: [], simulations: [] };
}

function readDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial = emptyDB();
    writeDB(initial);
    return initial;
  }
  try {
    return { ...emptyDB(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch (err) {
    // Corrupt db.json: keep a backup and start fresh instead of crashing every request
    console.error('db.json is unreadable, resetting it:', err.message);
    try { fs.renameSync(DB_FILE, `${DB_FILE}.corrupt-${Date.now()}`); } catch { /* ignore */ }
    const initial = emptyDB();
    writeDB(initial);
    return initial;
  }
}

function writeDB(data) {
  // write to a temp file then rename so a crash mid-write can't corrupt the database
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, DB_FILE);
}

function newId() {
  return Date.now().toString(36) + require('crypto').randomBytes(6).toString('hex');
}

const publicDoc = ({ userId, ...doc }) => doc; // eslint-disable-line no-unused-vars
const publicWrestler = publicDoc;

// --- Users ---
function createUser(email, passwordHash) {
  const db = readDB();
  if (db.users.some(u => u.email === email)) return null;
  const user = { _id: newId(), email, passwordHash, createdAt: new Date().toISOString() };
  db.users.push(user);
  writeDB(db);
  return user;
}
const findUserByEmail = (email) => readDB().users.find(u => u.email === email) || null;
const findUserById = (id) => readDB().users.find(u => u._id === id) || null;

// --- Wrestlers ---
function getWrestlers(userId) {
  return readDB().wrestlers
    .filter(w => w.userId === userId)
    .map(publicWrestler)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function addWrestler(userId, data) {
  const db = readDB();
  const wrestler = { ...data, _id: newId(), userId };
  db.wrestlers.push(wrestler);
  writeDB(db);
  return publicWrestler(wrestler);
}

function updateWrestler(userId, id, data) {
  const db = readDB();
  const idx = db.wrestlers.findIndex(w => w._id === id && w.userId === userId);
  if (idx === -1) return null;
  db.wrestlers[idx] = { ...db.wrestlers[idx], ...data, _id: id, userId };
  writeDB(db);
  return publicWrestler(db.wrestlers[idx]);
}

function deleteWrestler(userId, id) {
  const db = readDB();
  const before = db.wrestlers.length;
  db.wrestlers = db.wrestlers.filter(w => !(w._id === id && w.userId === userId));
  writeDB(db);
  return db.wrestlers.length !== before;
}

function replaceWrestlers(userId, list) {
  const db = readDB();
  db.wrestlers = db.wrestlers.filter(w => w.userId !== userId);
  const added = list.map(w => ({ ...w, _id: newId(), userId }));
  db.wrestlers.push(...added);
  writeDB(db);
  return added.map(publicWrestler).sort((a, b) => a.name.localeCompare(b.name));
}

const resetWrestlers = (userId) => replaceWrestlers(userId, DEFAULT_WRESTLERS);
const importWrestlers = (userId, list) => replaceWrestlers(userId, list);

// --- Setup ---
function getSetup(userId) {
  const mine = readDB().setups.filter(s => s.userId === userId);
  return mine.length > 0 ? publicDoc(mine[mine.length - 1]) : null;
}

function saveSetup(userId, wrestlers) {
  const db = readDB();
  const setup = { _id: newId(), userId, wrestlers, createdAt: new Date().toISOString() };
  db.setups = [...db.setups.filter(s => s.userId !== userId), setup]; // keep only the latest per user
  writeDB(db);
  return publicDoc(setup);
}

// --- Simulations ---
function getSimulations(userId) {
  return readDB().simulations.filter(s => s.userId === userId).reverse().slice(0, 10).map(publicDoc);
}

function getLatestSimulation(userId) {
  const mine = readDB().simulations.filter(s => s.userId === userId);
  return mine.length > 0 ? publicDoc(mine[mine.length - 1]) : null;
}

function saveSimulation(userId, data) {
  const db = readDB();
  const sim = { ...data, _id: newId(), userId, createdAt: new Date().toISOString() };
  db.simulations.push(sim);
  // keep the last 50 simulations per user so the file stays small
  const mine = db.simulations.filter(s => s.userId === userId);
  if (mine.length > 50) {
    const drop = new Set(mine.slice(0, mine.length - 50).map(s => s._id));
    db.simulations = db.simulations.filter(s => !drop.has(s._id));
  }
  writeDB(db);
  return publicDoc(sim);
}

module.exports = {
  createUser, findUserByEmail, findUserById,
  getWrestlers, addWrestler, updateWrestler, deleteWrestler,
  resetWrestlers, importWrestlers,
  getSetup, saveSetup,
  getSimulations, getLatestSimulation, saveSimulation,
  init: () => readDB()
};
