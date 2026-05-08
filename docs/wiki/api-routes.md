# api-routes

_Area: `apps/api/src/routes/` — Fastify route plugins_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/api/src/routes/auth.ts

**Description:** Fastify plugin for `/auth/*` endpoints. Validates request bodies against `@looper/shared` schemas, delegates to `authService`, and sets/clears an `httpOnly` `looper_auth` JWT cookie via a private `setAuthCookie` helper. Signup and login are rate-limited to 5 requests per minute via `@fastify/rate-limit`. Validation errors are wrapped as `ValidationError` and handled by the central `errorHandler`.

### Routes

- **`POST /auth/signup`** — rate-limited (5/min); validates SignupSchema, calls `signup()`, sets auth cookie, returns `{ user: PublicUser }`
- **`POST /auth/login`** — rate-limited (5/min); validates LoginSchema, calls `login()`, sets auth cookie, returns `{ user: PublicUser }`
- **`POST /auth/logout`** — clears auth cookie, returns 204
- **`GET /auth/me`** — guarded by `authGuard`, fetches current user, returns `{ user: PublicUser }`

### Depends on

- `@looper/shared` (LoginSchema, SignupSchema)
- `../services/authService.js`
- `../middleware/authGuard.js`
- `../errors.js` (ValidationError)
- `../config.js`

---

## apps/api/src/routes/loops.ts

**Description:** Fastify plugin for all `/loops/*` CRUD and presigned-URL endpoints. All mutating routes require auth via `authGuard`. All business logic is delegated to `loopService` — routes are thin validation + dispatch.

### Routes

- **`GET /loops/public`** — unauthenticated; returns `{ loops: LoopMeta[] }` for all public loops
- **`GET /loops`** — auth required; lists the authenticated user's loops
- **`GET /loops/:id`** — auth required; returns one loop (owner only)
- **`POST /loops`** — auth required; validates CreateLoopSchema; returns `{ loop, uploadUrl }` with 201
- **`PATCH /loops/:id`** — auth required; validates UpdateLoopSchema; returns updated loop metadata
- **`DELETE /loops/:id`** — auth required; idempotent delete; returns 204
- **`GET /loops/:id/download-url`** — auth required; returns `{ loop, downloadUrl }` with presigned S3 GET URL

### Depends on

- `@looper/shared` (CreateLoopSchema, UpdateLoopSchema)
- `../middleware/authGuard.js`
- `../errors.js` (ValidationError)
- `../services/loopService.js`

<!-- stale: apps/api/src/routes/CLAUDE.md --> <!-- at: 2026-05-08T05:03:35.965007+00:00 -->


<!-- stale: apps/api/src/routes/auth.ts --> <!-- at: 2026-05-08T05:45:44.239193+00:00 -->
