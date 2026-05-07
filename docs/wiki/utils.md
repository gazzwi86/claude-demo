# utils

## src/utils/hash.js

**Description:** Crypto helpers backing password storage and session tokens. Uses `scrypt` with a per-password salt and `timingSafeEqual` for verification.

### Functions

- **`sha256Hex(str)`** — returns the hex sha256 digest of the input.
- **`constantTimeEqual(a, b)`** — length-checked, timing-safe string compare.
- **`randomToken(bytes)`** — returns a hex-encoded random token (default 32 bytes).
- **`hashPassword(password, salt)`** — returns `<salt>:<scryptHex>` (generates a salt if absent).
- **`verifyPassword(password, stored)`** — compares against a `salt:hash` string in constant time.

### Exports

`module.exports = { sha256Hex, constantTimeEqual, randomToken, hashPassword, verifyPassword }`

### Depends on

- `node:crypto`

---

## src/utils/json.js

**Description:** Streaming JSON request body reader (with a 1 MB cap) and a tiny `sendJson` response helper that sets `Content-Type` and `Content-Length`.

### Functions

- **`readJsonBody(req)`** — resolves with parsed JSON or `{}` for empty bodies; rejects with `ValidationError` on oversize or invalid JSON.
- **`sendJson(res, status, body)`** — writes status, headers, and the JSON body in one shot.

### Exports

`module.exports = { readJsonBody, sendJson, MAX_BODY_BYTES }`

### Depends on

- `../errors` (ValidationError)

---

## src/utils/pagination.js

**Description:** Page param parsing and pagination envelope helpers. Clamps `pageSize` to the configured min/max and computes `total/totalPages/hasNext/hasPrev`.

### Functions

- **`parsePageParams(query)`** — returns `{ page, pageSize, offset }` with safe defaults.
- **`buildPaginatedResponse(items, page, total, pageSize)`** — returns `{ items, pagination }`.
- **`paginate(items, page, pageSize)`** — slices the array to the given page window.

### Exports

`module.exports = { parsePageParams, buildPaginatedResponse, paginate }`

### Depends on

- `../config` (config.pagination)

---

## src/utils/slug.js

**Description:** URL-slug helpers. `slugify` strips diacritics, lowercases, collapses separators, and caps length at 80; `uniqueSlug` appends a counter until an `exists` predicate returns false.

### Functions

- **`slugify(str)`** — returns a URL-safe slug; empty string for non-strings.
- **`uniqueSlug(base, exists)`** — returns the first non-colliding `<root>-<n>` candidate.

### Exports

`module.exports = { slugify, uniqueSlug }`

### Depends on

- external: none

---

<!-- stale: src/utils/validate.js --> <!-- at: 2026-05-07T03:46:00.778621+00:00 -->
