---
name: write-playwright-test
description: Guide for writing Playwright E2E or integration tests for apps/web. Invoke when the user says "write E2E test", "add playwright test", "write an integration test for X", or "add a browser test".
---

# Write a Playwright test

Follow these steps. For unit/API tests use `/write-vitest-test`. For component tests use `/write-rtl-test`.

## Step 1 — Identify the page or flow

Decide what to test: a page navigation, a user action sequence, an API-driven flow. Name the spec after the area or feature.

## Step 2 — Create the spec file

```
apps/web/e2e/<area>.spec.ts
```

Reference existing specs for patterns:

- `apps/web/e2e/studio.spec.ts` — audio engine state inspection via `window.__looperDebug`
- `apps/web/e2e/auth-live.spec.ts` — live auth flow with the seeded test user
- `apps/web/e2e/auth-pages.spec.ts` — page-level behavioural (network stubbed)

## Step 3 — Choose behavioural or live

**Behavioural (preferred for most tests):**

- Does not require a running server.
- Use `page.route()` to stub API calls.
- No auth setup needed for public pages.

```ts
await page.route("/api/loops*", (route) =>
  route.fulfill({ json: { loops: [] } })
);
```

**Live (for auth or real DB flows):**

- Requires `pnpm dev` + localstack running.
- Extend the pattern in `auth-live.spec.ts`.
- Use the seeded test user credentials from the seed script.

## Step 4 — Inspect audio engine state

For studio interactions, read engine state via the debug bridge:

```ts
const state = await page.evaluate(() => window.__looperDebug?.getState());
```

Reference `studio.spec.ts` for the full shape of the debug object.

## Step 5 — Use role-based selectors

Prefer accessible selectors in this order:

1. `page.getByRole("button", { name: /label/i })`
2. `page.getByLabel(/label/i)`
3. `page.getByText(/text/i)`

Avoid CSS selectors and `data-testid` unless no accessible alternative exists.

## Checklist before finishing

- [ ] Spec file placed under `apps/web/e2e/`
- [ ] Behavioural vs live decision made and documented in a comment
- [ ] Network calls stubbed with `page.route()` for behavioural tests
- [ ] Role-based selectors used
- [ ] Audio state inspected via `window.__looperDebug` where needed
