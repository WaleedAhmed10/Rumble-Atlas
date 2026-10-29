const mongoose = require('mongoose');
const User = require('../models/User');
const Wrestler = require('../models/Wrestler');
const RumbleSetup = require('../models/RumbleSetup');
const Simulation = require('../models/Simulation');
const DEFAULT_WRESTLERS = require('../data/defaultWrestlers');

const HIDE = '-userId -__v';
const validId = (id) => mongoose.isValidObjectId(id);

async function replaceWrestlers(userId, list) {
  await Wrestler.deleteMany({ userId });
  if (list.length === 0) return [];
  await Wrestler.insertMany(list.map(w => ({ ...w, userId })));
  return Wrestler.find({ userId }).select(HIDE).sort({ name: 1 });
}

module.exports = {
  init: () => Promise.all([User.init(), Wrestler.init(), RumbleSetup.init(), Simulation.init()]),

  users: {
    create: async (email, passwordHash) => {
      try {
        return await new User({ email, passwordHash }).save();
      } catch (err) {
        if (err.code === 11000) return null; // duplicate email
        throw err;
      }
    },
    findByEmail: (email) => User.findOne({ email }),
    findById: (id) => (validId(id) ? User.findById(id) : null)
  },

  wrestlers: {
    getAll: (userId) => Wrestler.find({ userId }).select(HIDE).sort({ name: 1 }),
    add: async (userId, data) => {
      const w = await new Wrestler({ ...data, userId }).save();
      return Wrestler.findById(w._id).select(HIDE);
    },
    update: (userId, id, data) => (validId(id)
      ? Wrestler.findOneAndUpdate({ _id: id, userId }, data, { new: true, runValidators: true }).select(HIDE)
      : null),
    remove: async (userId, id) => validId(id) && Boolean(await Wrestler.findOneAndDelete({ _id: id, userId })),
    reset: (userId) => replaceWrestlers(userId, DEFAULT_WRESTLERS),
    import: replaceWrestlers
  },

  setup: {
    get: (userId) => RumbleSetup.findOne({ userId }).select(HIDE).sort({ createdAt: -1 }),
    save: async (userId, wrestlers) => {
      await RumbleSetup.deleteMany({ userId }); // keep only the latest per user
      const s = await new RumbleSetup({ userId, wrestlers }).save();
      return RumbleSetup.findById(s._id).select(HIDE);
    }
  },

  simulations: {
    getAll: (userId) => Simulation.find({ userId }).select(HIDE).sort({ createdAt: -1 }).limit(10),
    getLatest: (userId) => Simulation.findOne({ userId }).select(HIDE).sort({ createdAt: -1 }),
    save: async (userId, data) => {
      const s = await new Simulation({ ...data, userId }).save();
      const old = await Simulation.find({ userId }).sort({ createdAt: -1 }).skip(50).select('_id');
      if (old.length) await Simulation.deleteMany({ _id: { $in: old.map(o => o._id) } });
      return Simulation.findById(s._id).select(HIDE);
    }
  }
};
