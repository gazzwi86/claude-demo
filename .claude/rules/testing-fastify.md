---
name: Testing — Fastify API
paths:
  - "apps/api/tests/**/*.test.ts"
---

## Fastify API Test Rules

- Use Vitest with `app.inject()` (not supertest) — see `apps/api/tests/auth.test.ts` for the pattern
- Import `buildServer` from `../src/server.js`
- Global setup at `apps/api/tests/setup.ts` sets `DDB_USE_STUB=1`, `S3_USE_STUB=1`, `BCRYPT_ROUNDS=1`, `JWT_SECRET=test-secret`, `SILENT=1` — do not set these yourself
- Use `app.inject({ method, url, payload, cookies })` for all HTTP assertions
- Assert specific status codes AND response body shapes (not just truthiness)
- One `describe` block per route file; `it` blocks per scenario
