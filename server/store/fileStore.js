const fileDb = require('../fileDb');
const p = (fn) => (...args) => Promise.resolve(fn(...args));

module.exports = {
  init: p(fileDb.init),

  users: {
    create: p(fileDb.createUser),
    findByEmail: p(fileDb.findUserByEmail),
    findById: p(fileDb.findUserById)
  },

  wrestlers: {
    getAll: p(fileDb.getWrestlers),
    add: p(fileDb.addWrestler),
    update: p(fileDb.updateWrestler),
    remove: p(fileDb.deleteWrestler),
    reset: p(fileDb.resetWrestlers),
    import: p(fileDb.importWrestlers)
  },

  setup: {
    get: p(fileDb.getSetup),
    save: p(fileDb.saveSetup)
  },

  simulations: {
    getAll: p(fileDb.getSimulations),
    getLatest: p(fileDb.getLatestSimulation),
    save: p(fileDb.saveSimulation)
  }
};
