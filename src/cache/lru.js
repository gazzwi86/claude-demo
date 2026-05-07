class LRUCache {
  constructor(maxSize = 100) {
    if (!Number.isInteger(maxSize) || maxSize <= 0) {
      throw new TypeError("maxSize must be a positive integer");
    }
    this.maxSize = maxSize;
    this.map = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    if (!this.map.has(key)) {
      this.misses++;
      return undefined;
    }
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    this.hits++;
    return value;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    return value;
  }

  has(key) {
    return this.map.has(key);
  }

  delete(key) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
    this.hits = 0;
    this.misses = 0;
  }

  get size() {
    return this.map.size;
  }

  stats() {
    return { hits: this.hits, misses: this.misses, size: this.size, maxSize: this.maxSize };
  }
}

module.exports = { LRUCache };
