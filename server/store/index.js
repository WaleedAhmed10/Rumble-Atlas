const fileStore = require('./fileStore');
const mongoStore = require('./mongoStore');

let active = fileStore;

// Forward every call to whichever store (file / mongo) is currently active
const fwd = (group, fn) => (...args) => active[group][fn](...args);
const group = (name, fns) => Object.fromEntries(fns.map(fn => [fn, fwd(name, fn)]));

module.exports = {
  useFile() { active = fileStore; global.dbMode = 'file'; },
  useMongo() { active = mongoStore; global.dbMode = 'mongo'; },
  init: () => active.init(),

  users: group('users', ['create', 'findByEmail', 'findById']),
  wrestlers: group('wrestlers', ['getAll', 'add', 'update', 'remove', 'reset', 'import']),
  setup: group('setup', ['get', 'save']),
  simulations: group('simulations', ['getAll', 'getLatest', 'save'])
};
