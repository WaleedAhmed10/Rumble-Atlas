// Sanitize wrestler list before saving to database
const { cleanWrestler } = require('./validate');

function sanitizeWrestlers(wrestlers) {
  if (!Array.isArray(wrestlers)) return [];
  return wrestlers.map(cleanWrestler).filter(Boolean);
}

module.exports = { sanitizeWrestlers };
