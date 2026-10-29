const mongoose = require('mongoose');

const rumbleSetupSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  wrestlers: [{
    wrestlerId: String,
    name: String,
    winProbability: Number,
    eliminationResistance: Number,
    brand: String,
    entryNumber: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RumbleSetup', rumbleSetupSchema);
