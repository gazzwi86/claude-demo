# Routes — `apps/api/src/routes/`

All request body schemas come from `@looper/shared` (e.g. `CreateLoopSchema`, `UpdateLoopSchema`, `LoginSchema`). Never define inline Zod schemas in route files — validate with `.safeParse()` and throw `ValidationError` on failure.

Response status conventions: `POST` returns 201 + the created object, `GET` returns 200 + data, `PATCH` returns 200 + the updated object, `DELETE` returns 204 with no body (`reply.code(204).send()`).

Error handling: throw `AppError` subclasses from `../errors.js` (`ValidationError` → 422, `UnauthorizedError` → 401, `ForbiddenError` → 403, `NotFoundError` → 404, `DuplicateEmailError` → 409). The `errorHandler` middleware maps them to the correct HTTP status — never call `reply.code()` for errors manually.

Auth guard: routes that require authentication register `{ preHandler: authGuard }` as a route option. After the guard runs, `request.user` is populated with `{ id: string }`. The `/loops/public` endpoint is the only loops route that omits `authGuard`. Auth state is carried in an `httpOnly` cookie named `looper_auth`.

Presigned upload flow: `POST /loops` returns `{ loop, uploadUrl }`. The client PUTs the audio blob directly to S3 using `uploadUrl` — the API never proxies audio bytes. Similarly, `GET /loops/:id/download-url` returns a short-lived presigned GET URL.

Tests use `app.inject()` (Fastify's `light-my-request` integration) — see `apps/api/tests/` for the established pattern. Every new route must have a corresponding test file.
