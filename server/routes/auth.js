const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const store = require('../store');
const { jwtSecret, TOKEN_TTL } = require('../config');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const BCRYPT_COST = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Strict limit on guessing: 10 failed attempts per 15 minutes per IP (successful logins don't count)
const failedAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' }
});
// Limit account creation: 10 per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this network. Please try again later.' }
});

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

function issueToken(user) {
  return jwt.sign({ sub: String(user._id) }, jwtSecret, { algorithm: 'HS256', expiresIn: TOKEN_TTL });
}

const publicUser = (user) => ({ id: String(user._id), email: user.email });

function readCredentials(body) {
  const email = body?.email;
  const password = body?.password;
  // typeof checks also block NoSQL-injection payloads such as { "email": { "$ne": "" } }
  if (typeof email !== 'string' || typeof password !== 'string') return null;
  return { email: email.trim().toLowerCase(), password };
}

router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const creds = readCredentials(req.body);
    if (!creds || !EMAIL_RE.test(creds.email) || creds.email.length > 254) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    // bcrypt only uses the first 72 bytes, so cap there
    if (creds.password.length < 8 || Buffer.byteLength(creds.password) > 72) {
      return res.status(400).json({ error: 'Password must be 8-72 characters' });
    }
    if (!/[a-zA-Z]/.test(creds.password) || !/[0-9]/.test(creds.password)) {
      return res.status(400).json({ error: 'Password must contain at least one letter and one number' });
    }

    const passwordHash = await bcrypt.hash(creds.password, BCRYPT_COST);
    const user = await store.users.create(creds.email, passwordHash);
    if (!user) return res.status(409).json({ error: 'An account with this email already exists' });

    await store.wrestlers.reset(String(user._id)); // every new account starts with the default roster
    res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', failedAuthLimiter, async (req, res, next) => {
  try {
    const creds = readCredentials(req.body);
    if (!creds) return res.status(400).json({ error: 'Email and password are required' });

    const user = await store.users.findByEmail(creds.email);
    const ok = await bcrypt.compare(creds.password.slice(0, 200), user ? user.passwordHash : DUMMY_HASH);
    if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ token: issueToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
