const Wrestler = require('../models/Wrestler');
const RumbleSetup = require('../models/RumbleSetup');
const Simulation = require('../models/Simulation');
const DEFAULT_WRESTLERS = require('../data/defaultWrestlers');

async function seed() {
  const count = await Wrestler.countDocuments();
  if (count === 0) {
    await Wrestler.insertMany(DEFAULT_WRESTLERS);
  }
}

module.exports = {
  init: seed,
  seed,

  wrestlers: {
    getAll: () => Wrestler.find().sort({ name: 1 }),
    add: (data) => new Wrestler(data).save(),
    update: (id, data) => Wrestler.findByIdAndUpdate(id, data, { new: true, runValidators: true }),
    remove: async (id) => Boolean(await Wrestler.findByIdAndDelete(id)),
    reset: async () => {
      await Wrestler.deleteMany({});
      return Wrestler.insertMany(DEFAULT_WRESTLERS);
    },
    import: async (list) => {
      await Wrestler.deleteMany({});
      return Wrestler.insertMany(list);
    }
  },

  setup: {
    get: () => RumbleSetup.findOne().sort({ createdAt: -1 }),
    save: (wrestlers) => new RumbleSetup({ wrestlers }).save()
  },

  simulations: {
    getAll: () => Simulation.find().sort({ createdAt: -1 }).limit(10),
    getLatest: () => Simulation.findOne().sort({ createdAt: -1 }),
    save: (data) => new Simulation(data).save()
  }
};
