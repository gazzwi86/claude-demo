# core

## src/config.js

**Description:** Centralised configuration object built from environment variables with safe defaults. Exposes server, rate limit, cache, pagination, CORS, and session TTL settings consumed across the codebase.

### Functions

_(no functions; module exports a plain config object)_

### Exports

`module.exports = { config }`

### Depends on

- external: `process.env` only

---

## src/errors.js

**Description:** Defines the `AppError` base class and typed subclasses used throughout the app. Every error carries an HTTP status, a stable string code, and serialises to a consistent JSON envelope via `toJSON()`.

### Functions

- **`AppError#constructor(message, status, code)`** — base error with HTTP status and stable code.
- **`AppError#toJSON()`** — serialises to `{ error: { message, code, status } }`.
- **`ValidationError#constructor(message, details)`** — 400 error; carries optional per-field details.
- **`ValidationError#toJSON()`** — augments the base envelope with `details` when present.
- **`AuthError#constructor(message)`** — 401 error.
- **`NotFoundError#constructor(resource)`** — 404 error formatted as `<resource> not found`.
- **`RateLimitError#constructor(message)`** — 429 error.

### Exports

`module.exports = { AppError, ValidationError, AuthError, NotFoundError, RateLimitError }`

### Depends on

- external: none

---

## src/router.js

**Description:** Tiny path-pattern router built on `RegExp`. Compiles `/posts/:id`-style patterns into a regex and a key list, then matches an incoming `(method, pathname)` to the first matching handler and extracts URL params.

### Functions

- **`compilePattern(pattern)`** — turns a `:param` pattern into `{ regex, keys }`.
- **`createRouter()`** — returns a router with `add/match` plus `get/post/put/patch/delete` shortcuts.

### Exports

`module.exports = { createRouter, compilePattern }`

### Depends on

- external: none

---

## src/server.js

**Description:** Thin wrapper over `node:http` that turns a `(req, res)` handler into an `http.Server` and exposes a promise-based `listen` for clean startup.

### Functions

- **`createServer(router)`** — wraps a router handler in `http.createServer`; throws if the router is not a function.
- **`listen(server, port, host)`** — promisified `server.listen` that resolves with the server.

### Exports

`module.exports = { createServer, listen }`

### Depends on

- `node:http`
