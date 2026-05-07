# cache

## src/cache/index.js

**Description:** Wires the shared `LRUCache` instances used across services. Exposes singleton caches for posts and feeds sized from `config`, plus a `clearAll` helper used in tests.

### Functions

- **`clearAll()`** — clears both the posts and feed caches.

### Exports

`module.exports = { postsCache, feedCache, clearAll }`

### Depends on

- `./lru` (LRUCache)
- `../config` (config)

---

## src/cache/lru.js

**Description:** Map-backed LRU cache with capacity bound, recency refresh on `get`, and hit/miss accounting. Eviction picks the oldest insertion-order entry once size exceeds `maxSize`.

### Functions

- **`LRUCache#constructor(maxSize)`** — validates a positive integer capacity.
- **`LRUCache#get(key)`** — returns the value and bumps it to most-recent; counts hit/miss.
- **`LRUCache#set(key, value)`** — inserts/updates and evicts the oldest if over capacity.
- **`LRUCache#has(key)`** — checks key presence without touching recency.
- **`LRUCache#delete(key)`** — removes a key.
- **`LRUCache#clear()`** — empties the cache and resets stats.
- **`LRUCache#size`** — getter returning the current entry count.
- **`LRUCache#stats()`** — returns `{ hits, misses, size, maxSize }`.

### Exports

`module.exports = { LRUCache }`

### Depends on

- external: none
