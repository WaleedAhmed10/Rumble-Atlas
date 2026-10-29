require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const store = require('./store');
const { allowedOrigins, isProd } = require('./config');
const { requireAuth } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const wrestlerRoutes = require('./routes/wrestlers');
const setupRoutes = require('./routes/setup');
const simulationRoutes = require('./routes/simulations');
const predictRoutes = require('./routes/predict');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/royal-rumble';

mongoose.set('bufferCommands', false);
mongoose.set('sanitizeFilter', true); // strips $-operators from query filters (NoSQL injection)

app.set('trust proxy', 1); // behind Render's proxy: use the real client IP for rate limiting
app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    // no Origin header = curl / server-to-server / same-origin; browsers always send one cross-site
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));
app.use(express.json({ limit: '1mb' }));

// General limit for everything under /api
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Royal Rumble API is running' });
});

app.use('/api/auth', authRoutes);

// Everything below needs a signed-in user, and only ever touches that user's own data
app.use('/api/wrestlers', requireAuth, wrestlerRoutes);
app.use('/api/setup', requireAuth, setupRoutes);
app.use('/api/simulations', requireAuth, simulationRoutes);
// Predictions are CPU heavy, so they get a tighter limit
app.use('/api/predict', requireAuth,
  rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }),
  predictRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Never leak stack traces / internals to the client
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    store.useMongo();
  } catch {
    if (isProd) console.warn('MongoDB not reachable - using local JSON file storage (data is lost on redeploy).');
    store.useFile();
  }
  await store.init();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (${global.dbMode} storage)`);
  });
}

startServer();
