const jwt = require('jsonwebtoken');
const store = require('../store');
const { jwtSecret } = require('../config');

// Requires "Authorization: Bearer <token>". Sets req.user = { id, email }.
async function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Please sign in' });

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    } catch {
      return res.status(401).json({ error: 'Your session has expired. Please sign in again' });
    }

    const user = await store.users.findById(String(payload.sub));
    if (!user) return res.status(401).json({ error: 'Please sign in' }); // e.g. account no longer exists
    req.user = { id: String(user._id), email: user.email };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
