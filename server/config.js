const crypto = require('crypto');

const isProd = process.env.NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  if (isProd) {
    console.error('FATAL: set JWT_SECRET (at least 32 random characters) in production.');
    process.exit(1);
  }
  // Development only: random secret, so logins reset each time the server restarts.
  jwtSecret = crypto.randomBytes(48).toString('hex');
  console.warn('JWT_SECRET not set (or too short) - using a temporary one. Logins will reset on restart.');
}

// Origins allowed to call the API from a browser (comma separated), e.g. https://my-app.vercel.app
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
if (isProd && allowedOrigins.length === 0) {
  console.warn('CLIENT_ORIGIN is not set - browsers on other domains will be blocked by CORS.');
}
if (!isProd && allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173');
}

module.exports = { isProd, jwtSecret, allowedOrigins, TOKEN_TTL: '7d' };
