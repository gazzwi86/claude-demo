# api-src

_Area: `apps/api/src/` — Fastify server factory and entrypoint_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/api/src/server.ts

**Description:** Fastify server factory (`buildServer`) and `main()` entrypoint. Registers `@fastify/cookie` (signed with `jwtSecret`), `@fastify/cors` (credentialed, restricted to `webOrigin`), the global error handler, and all route plugins. Logger uses `pino-pretty` in dev, JSON in prod, and is silenced when `SILENT=1`. The file detects whether it is the process entrypoint via `import.meta.url` and only calls `main()` in that case, which keeps it importable by tests without side effects.

### Exports

- **`buildServer()`** — `async` factory; returns a configured Fastify instance. Used directly by tests via `app.inject()`.

### Routes registered

- `GET /health` — returns `{ ok: true, ts: <ISO timestamp> }`
- `authRoutes` — mounted from `./routes/auth.js` (handles `/auth/*`)
- `loopsRoutes` — mounted from `./routes/loops.js` (handles `/loops/*`)

### Depends on

- `fastify`, `@fastify/cookie`, `@fastify/cors`
- `./config.js` (env var config)
- `./middleware/errorHandler.js` (maps `AppError` subclasses to HTTP responses)
- `./routes/auth.js`
- `./routes/loops.js`

<!-- stale: apps/api/src/server.ts --> <!-- at: 2026-05-08T05:11:28.185097+00:00 -->
