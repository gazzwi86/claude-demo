# api-tests

_Area: `apps/api/tests/`_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/api/tests/setup.ts

**Description:** Vitest global setup for the API test suite. Sets `DDB_USE_STUB=1`, `S3_USE_STUB=1`, `BCRYPT_ROUNDS=1` (fast hashing), `JWT_SECRET=test-secret`, and `SILENT=1` (suppress pino output). This file runs before any test module, ensuring no test ever touches real AWS or Docker.

---

## apps/api/tests/auth.test.ts

**Description:** 11 Vitest specs for `/auth/*` using Fastify's `app.inject()`. Covers: signup success and `{ user }` response shape; duplicate email returns 409; login with correct credentials returns user + sets cookie; login with wrong password returns 401; `/auth/me` with valid cookie returns user; `/auth/me` with no/invalid cookie returns 401; logout clears cookie.

---

## apps/api/tests/loops.test.ts

**Description:** 13 Vitest specs for `/loops/*` endpoints. Covers: unauthenticated access returns 401; create loop returns 201 + uploadUrl; list returns only own loops; `GET /loops/public` returns public loops without auth; get own loop returns 200; get private loop as other user returns 403; patch updates name/bpm; delete returns 204; double-delete returns 204 (idempotent).
