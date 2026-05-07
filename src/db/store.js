class KeyedStore {
  constructor() {
    this.items = new Map();
    this.nextId = 1;
  }

  insert(data) {
    const id = data.id || this.nextId++;
    if (typeof id === "number" && id >= this.nextId) this.nextId = id + 1;
    const record = { ...data, id };
    this.items.set(id, record);
    return record;
  }

  get(id) {
    return this.items.get(id);
  }

  update(id, patch) {
    const existing = this.items.get(id);
    if (!existing) return null;
    const next = { ...existing, ...patch, id: existing.id };
    this.items.set(id, next);
    return next;
  }

  delete(id) {
    return this.items.delete(id);
  }

  list(filterFn) {
    const all = Array.from(this.items.values());
    return filterFn ? all.filter(filterFn) : all;
  }

  count(filterFn) {
    if (!filterFn) return this.items.size;
    return this.list(filterFn).length;
  }

  clear() {
    this.items.clear();
    this.nextId = 1;
  }
}

module.exports = { KeyedStore };
