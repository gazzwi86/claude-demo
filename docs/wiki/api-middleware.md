# api-middleware

_Area: `apps/api/src/middleware/`_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/api/src/middleware/authGuard.ts

**Description:** Fastify `preHandler` that reads the `looper_auth` httpOnly cookie, calls `verifyToken`, and attaches `{ id, email }` claims to `request.user`. Any missing cookie or invalid JWT throws `UnauthorizedError`, which the central error handler maps to 401.

### Exports

- **`authGuard(request, _reply)`** — Fastify preHandler function; augments the global `FastifyRequest` interface with `user?: { id: string; email: string }`

### Depends on

- `../errors.js` (UnauthorizedError)
- `../services/authService.js` (AUTH_COOKIE_NAME, verifyToken)

---

## apps/api/src/middleware/errorHandler.ts

**Description:** Fastify error handler plugin that maps typed `AppError` subclasses to their HTTP status codes and consistent `{ error: string, message: string }` JSON response shapes. Unknown errors fall through as 500 with a generic message (no stack traces in responses).

### Exports

- **`errorHandler(app)`** — calls `app.setErrorHandler`; maps ValidationError → 422, UnauthorizedError → 401, ForbiddenError → 403, NotFoundError → 404, DuplicateEmailError → 409, else → 500

### Depends on

- `../errors.js`
