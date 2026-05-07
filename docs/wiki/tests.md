# tests

## tests/auth.test.js

**Description:** Covers the auth service end-to-end against the real in-memory repositories: registration validation and dedup, login/logout, and `me()` token resolution.

### Functions

- **`describe("auth service", ...)`** — registration, login, logout, and session lookup tests; resets repositories before each.

### Exports

_(test file; no exports)_

### Depends on

- `node:test`, `node:assert`
- `../src/db/repository` (resetAll)
- `../src/services/auth`
- `../src/errors` (ValidationError, AuthError)

---

## tests/cache.test.js

**Description:** Unit tests for `LRUCache`: storage, eviction, recency refresh on `get`, deletion, hit/miss stats, and `maxSize` validation.

### Functions

- **`describe("LRUCache", ...)`** — exhaustive LRU behaviour assertions.

### Exports

_(test file; no exports)_

### Depends on

- `node:test`, `node:assert`
- `../src/cache/lru` (LRUCache)

---

## tests/posts.test.js

**Description:** Posts service tests covering creation, validation, paginated listing, fetch, author-only update/delete, and missing-post errors.

### Functions

- **`makeUser(email)`** — helper that registers a default user.
- **`describe("posts service", ...)`** — CRUD and authorization tests; resets repositories and caches before each.

### Exports

_(test file; no exports)_

### Depends on

- `node:test`, `node:assert`
- `../src/db/repository` (resetAll)
- `../src/cache` (clearAll)
- `../src/services/posts`
- `../src/services/auth`
- `../src/errors` (ValidationError, NotFoundError, AuthError)

---

## tests/rate-limit.test.js

**Description:** Sliding-window rate limiter tests: under-limit allow, over-limit throw, window expiry, per-IP isolation, and `x-forwarded-for` precedence.

### Functions

- **`makeReq(ip)`** — minimal mock request with headers and socket.
- **`describe("rate limiter", ...)`** — limiter behaviour tests using deterministic `now` values.

### Exports

_(test file; no exports)_

### Depends on

- `node:test`, `node:assert`
- `../src/middleware/rate-limit` (createRateLimiter)
- `../src/errors` (RateLimitError)

---

## tests/utils.test.js

**Description:** Pure-function tests for slug, pagination, and hash helpers (deterministic sha256, constant-time compare, scrypt password roundtrip).

### Functions

- **`describe("slugify", ...)`** — case, punctuation, whitespace, and non-string handling.
- **`describe("uniqueSlug", ...)`** — counter suffix until non-colliding.
- **`describe("parsePageParams", ...)`** — defaults, min clamp, max clamp.
- **`describe("buildPaginatedResponse", ...)`** — pagination metadata.
- **`describe("paginate", ...)`** — array windowing.
- **`describe("hash utils", ...)`** — sha256, constant-time compare, password hash/verify.

### Exports

_(test file; no exports)_

### Depends on

- `node:test`, `node:assert`
- `../src/utils/slug` (slugify, uniqueSlug)
- `../src/utils/pagination` (parsePageParams, buildPaginatedResponse, paginate)
- `../src/utils/hash` (sha256Hex, constantTimeEqual, hashPassword, verifyPassword)
