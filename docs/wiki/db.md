# db

## src/db/repository.js

**Description:** Builds named repositories on top of `KeyedStore`. Exposes a fixed set of repos (`users`, `posts`, `comments`, `tags`, `sessions`, `postTags`) and a `resetAll` helper for tests.

### Functions

- **`createRepository(name)`** — returns CRUD methods (`create/findById/findOne/findAll/update/remove/count/clear`) over a fresh store.
- **`resetAll()`** — clears every repository.

### Exports

`module.exports = { createRepository, repositories, resetAll }`

### Depends on

- `./store` (KeyedStore)

---

## src/db/store.js

**Description:** In-memory keyed store with auto-incrementing numeric ids. Provides minimal CRUD and `list/count` helpers with optional filter predicates.

### Functions

- **`KeyedStore#insert(data)`** — assigns/uses an id and stores a shallow copy; auto-bumps `nextId`.
- **`KeyedStore#get(id)`** — returns the record by id or `undefined`.
- **`KeyedStore#update(id, patch)`** — merges `patch` over the existing record (id pinned); returns the updated record or `null`.
- **`KeyedStore#delete(id)`** — removes by id; returns boolean.
- **`KeyedStore#list(filterFn)`** — returns an array of values, optionally filtered.
- **`KeyedStore#count(filterFn)`** — counts entries, optionally filtered.
- **`KeyedStore#clear()`** — drops all entries and resets `nextId`.

### Exports

`module.exports = { KeyedStore }`

### Depends on

- external: none
