const { describe, it } = require("node:test");
const assert = require("node:assert");
const { LRUCache } = require("../src/cache/lru");

describe("LRUCache", () => {
  it("stores and retrieves values", () => {
    const c = new LRUCache(3);
    c.set("a", 1);
    assert.strictEqual(c.get("a"), 1);
  });

  it("returns undefined for missing keys", () => {
    const c = new LRUCache(3);
    assert.strictEqual(c.get("missing"), undefined);
  });

  it("evicts the least recently used entry", () => {
    const c = new LRUCache(2);
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    assert.strictEqual(c.has("a"), false);
    assert.strictEqual(c.get("b"), 2);
    assert.strictEqual(c.get("c"), 3);
  });

  it("get refreshes recency", () => {
    const c = new LRUCache(2);
    c.set("a", 1);
    c.set("b", 2);
    c.get("a");
    c.set("c", 3);
    assert.strictEqual(c.has("a"), true);
    assert.strictEqual(c.has("b"), false);
  });

  it("delete removes an entry", () => {
    const c = new LRUCache(2);
    c.set("a", 1);
    assert.strictEqual(c.delete("a"), true);
    assert.strictEqual(c.has("a"), false);
  });

  it("tracks hit/miss stats", () => {
    const c = new LRUCache(2);
    c.set("a", 1);
    c.get("a");
    c.get("nope");
    const stats = c.stats();
    assert.strictEqual(stats.hits, 1);
    assert.strictEqual(stats.misses, 1);
    assert.strictEqual(stats.size, 1);
  });

  it("rejects invalid maxSize", () => {
    assert.throws(() => new LRUCache(0), TypeError);
    assert.throws(() => new LRUCache(-1), TypeError);
    assert.throws(() => new LRUCache(1.5), TypeError);
  });
});
