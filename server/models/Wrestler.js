const mongoose = require('mongoose');

const wrestlerSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  winProbability: { type: Number, default: 5 },
  eliminationResistance: { type: Number, default: 1.0 },
  brand: { type: String, default: 'Unknown' }
});

module.exports = mongoose.model('Wrestler', wrestlerSchema);
