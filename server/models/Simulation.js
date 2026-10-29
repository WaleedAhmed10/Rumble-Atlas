const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  winner: String,
  matchDuration: Number,
  mostEliminations: Number,
  mostEliminationsName: String,
  ironMan: String,
  ironManMinutes: Number,
  totalEliminations: Number,
  timeline: [{ minute: Number, text: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Simulation', simulationSchema);
