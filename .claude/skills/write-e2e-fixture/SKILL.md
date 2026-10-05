---
name: write-e2e-fixture
description: Extend the Playwright fixture file for apps/web/e2e. Invoke when the user says "add an E2E fixture", "extend fixtures.ts", "share state across steps", or "add a new test fixture".
---

# Extend E2E fixtures

All fixtures are defined in `apps/web/e2e/fixtures.ts`. This file re-exports
`test` (the fixture-extended base) and `expect` for use across all step files.

## Existing fixtures

| Fixture | Type | Purpose |
|---|---|---|
| `loginPage` | `LoginPage` | Login page POM |
| `signupPage` | `SignupPage` | Signup page POM |
| `studioPage` | `StudioPage` | Studio page POM + audio debug bridge |
| `serverHit` | `{ value: boolean }` | Mutable flag — set `true` inside a `page.route()` handler to assert a route was (or was not) called |
| `loggedIn` | `void` | Side-effect fixture — navigates to `/login` and authenticates with the seeded test user before the step body runs; requires localstack |

## Adding a new page object fixture

```typescript
// 1. Import the new page class (use .js extension for ESM resolution)
import { WidgetPage } from "./pages/WidgetPage.js";

// 2. Add to the Fixtures type
type Fixtures = {
  loginPage: LoginPage;
  signupPage: SignupPage;
  studioPage: StudioPage;
  serverHit: { value: boolean };
  loggedIn: void;
  widgetPage: WidgetPage;   // ← add here
};

// 3. Add the fixture implementation inside base.extend<Fixtures>({...})
widgetPage: async ({ page }, use) => {
  await use(new WidgetPage(page));
},
```

## Adding a mutable state fixture

Use an object wrapper so mutations inside step bodies are visible to later steps:

```typescript
type Fixtures = {
  // ...
  capturedId: { value: string | null };
};

capturedId: async ({}, use) => {
  await use({ value: null });
},
```

## Adding a void (side-effect) fixture

Void fixtures run setup before calling `use()` and teardown after:

```typescript
type Fixtures = {
  // ...
  authenticated: void;
};

authenticated: [async ({ page }, use) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASS);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/studio");
  await use();
  // teardown here if needed (e.g. clear cookies)
}, { auto: false }],
```

## File shape

```typescript
import { test as base } from "playwright-bdd";
import { LoginPage } from "./pages/LoginPage.js";
// ... other imports

export const TEST_EMAIL = "test@test.com";
export const TEST_PASS = "testtest";

type Fixtures = { /* ... */ };

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => await use(new LoginPage(page)),
  // ...
});

export { expect } from "@playwright/test";
```

## Checklist

- [ ] New page class imported with `.js` extension
- [ ] Type added to the `Fixtures` type block
- [ ] Fixture implementation added inside `base.extend<Fixtures>({...})`
- [ ] Page object fixtures: `async ({ page }, use) => await use(new PageClass(page))`
- [ ] Mutable state fixtures: wrap in `{ value: ... }` object
- [ ] Credential constants use named exports (`TEST_EMAIL`, `TEST_PASS`) — never object properties named `"password"`
