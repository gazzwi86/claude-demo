# middleware

## src/middleware/auth.js

**Description:** Bearer-token session middleware. Pulls `Authorization: Bearer <token>` off the request, resolves it via the auth service, and attaches `req.user`/`req.session` for handlers.

### Functions

- **`extractBearer(req)`** — returns the trimmed token or `null` if header missing/malformed.
- **`requireSession(req)`** — throws `AuthError` if no/invalid token; attaches user/session and returns the resolved session.
- **`optionalSession(req)`** — same as above but returns `null` instead of throwing when unauthenticated.

### Exports

`module.exports = { requireSession, optionalSession, extractBearer }`

### Depends on

- `../errors` (AuthError)
- `../services/auth` (me)

---

## src/middleware/cors.js

**Description:** Sets standard CORS response headers from config and short-circuits `OPTIONS` preflight with a 204.

### Functions

- **`applyCors(req, res, options)`** — writes `Access-Control-*` headers; returns `true` if the preflight was handled, otherwise `false`.

### Exports

`module.exports = { applyCors }`

### Depends on

- `../config` (config.cors)

---

## src/middleware/error-handler.js

**Description:** Converts thrown errors into JSON responses. Known `AppError`s use their declared status/body; unknown errors become a 500 whose message is hidden in production.

### Functions

- **`handleError(err, req, res)`** — sends the appropriate JSON error envelope unless headers already sent.
- **`wrap(handler)`** — async wrapper that funnels rejections into `handleError`.

### Exports

`module.exports = { handleError, wrap }`

### Depends on

- `../errors` (AppError)
- `../utils/json` (sendJson)

---

## src/middleware/rate-limit.js

**Description:** Per-client sliding-window limiter keyed by `x-forwarded-for` (first IP) or socket remote address. Throws `RateLimitError` when a bucket exceeds `max` within `windowMs`.

### Functions

- **`createRateLimiter(options)`** — returns `{ check, reset, getClientKey }` bound to a private bucket map.

### Exports

`module.exports = { createRateLimiter }`

### Depends on

- `../errors` (RateLimitError)
- `../config` (config.rateLimit)
