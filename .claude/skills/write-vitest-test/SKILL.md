---
name: write-vitest-test
description: Guide for writing Vitest unit or integration tests for API routes and shared-package code. Invoke when the user says "write tests", "write unit tests", "add tests for X", or "test this function/service/route" in the context of apps/api or packages/shared.
---

# Write a Vitest test (API / shared)

Follow these steps. For React component tests, use `/write-rtl-test` instead. For E2E, use `/write-playwright-test`.

## Step 1 — Identify what to test

Determine the specific target:

- **Route handler** → `apps/api/src/routes/<area>.ts`
- **Service function** → `apps/api/src/services/<area>Service.ts`
- **DB helper** → `apps/api/src/db/<table>.ts`
- **Shared schema/type** → `packages/shared/src/schemas.ts` or `types.ts`

## Step 2 — Check global test setup

Read `apps/api/tests/setup.ts` before writing anything. Note:

- Environment variables set for all tests (e.g. `DDB_USE_STUB=1`).
- Any global beforeAll/afterAll hooks.

## Step 3 — Locate or create the test file

- Route/service/db tests → `apps/api/tests/<area>.test.ts`
- Shared schema tests → `packages/shared/src/schemas.test.ts`

If the file already exists, append new `describe`/`it` blocks. Do not restructure existing tests.

## Step 4 — Scaffold the test

**For route tests** — use `app.inject()`:

```ts
import { buildServer } from "../src/server.js";

const app = buildServer();
await app.ready();

const res = await app.inject({
  method: "POST",
  url: "/loops",
  payload: { /* deterministic test data */ },
});

assert.equal(res.statusCode, 201);
```

**For unit tests** — import the function directly:

```ts
import { myFunction } from "../src/services/loopService.js";
```

## Step 5 — Apply testing rules

From `.claude/rules/testing.md` and `.claude/rules/testing-fastify.md`:

- Assert specific values — `assert.equal(res.statusCode, 201)`, not just `assert.ok(res)`.
- No network calls — DB is stubbed via `DDB_USE_STUB=1` env var.
- No random data — use fixed strings/IDs in every test.
- Each test must be deterministic and order-independent.
- Use `node:assert` or Vitest's `expect` — no chai, no jest matchers.

## Checklist before finishing

- [ ] `setup.ts` read and env vars accounted for
- [ ] Test file placed in the correct directory
- [ ] `app.inject()` used for route tests (not `fetch`)
- [ ] Assertions check specific values, not truthiness
- [ ] No random data, no network calls
