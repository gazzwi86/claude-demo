const { KeyedStore } = require("./store");

function createRepository(name) {
  const store = new KeyedStore();

  return {
    name,
    create: (data) => store.insert(data),
    findById: (id) => store.get(id) || null,
    findOne: (predicate) => store.list(predicate)[0] || null,
    findAll: (predicate) => store.list(predicate),
    update: (id, patch) => store.update(id, patch),
    remove: (id) => store.delete(id),
    count: (predicate) => store.count(predicate),
    clear: () => store.clear(),
    _store: store,
  };
}

const repositories = {
  users: createRepository("users"),
  posts: createRepository("posts"),
  comments: createRepository("comments"),
  tags: createRepository("tags"),
  sessions: createRepository("sessions"),
  postTags: createRepository("postTags"),
};

function resetAll() {
  for (const repo of Object.values(repositories)) repo.clear();
}

module.exports = { createRepository, repositories, resetAll };
