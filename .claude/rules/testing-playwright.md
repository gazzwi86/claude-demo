---
name: Playwright BDD E2E tests
paths:
  - "apps/web/e2e/**"
---

## Playwright BDD Rules

Applies to all files under `apps/web/e2e/`.

### Feature files (`features/**/*.feature`)

- Every feature file must have a `@behavioural`, `@live`, or `@visual` tag on the `Feature` block
- Every `Scenario` must carry at least one of `@smoke`, `@regression`, or `@a11y`
- Group related scenarios under `Rule` blocks; use `Background` at both feature and rule level
- Rule-level `Background` stacks with the feature-level `Background` — both run for each scenario
- Steps must describe intent, not implementation (`"I log in"`, not `"I fill the email field and click Sign in"`)

### Step definitions (`steps/**/*.ts`)

- Import `createBdd` tied to the project `test` from `../fixtures.js` — not from `playwright-bdd` directly
- Use Cucumber expressions for parameters (`{string}`, `{int}`, `{float}`)
- Prefer page object methods over raw `page.*` calls inside step bodies
- Steps that share step text across `Given`/`When`/`Then` must each be declared separately

### Page objects (`pages/**/*.ts`)

- Constructor takes `readonly page: Page`
- Expose actions as `async` methods (`goto()`, `submit()`, `blockApi()`)
- Expose locators as `get` properties returning `Locator` — never resolved `ElementHandle`
- No assertions inside page objects — assertions belong in step definitions

### Fixtures (`fixtures.ts`)

- All page object fixtures follow the pattern: `async ({ page }, use) => await use(new PageClass(page))`
- `serverHit` is a mutable `{ value: boolean }` object for asserting a route was not called
- `loggedIn` is a `void` fixture that runs the full login flow as a side effect before the step body

### Selectors

1. `getByRole(role, { name: /label/i })` — always preferred
2. `getByLabel(/label/i)` — for form controls
3. `getByText(/text/i)` — last resort

Never use CSS selectors or `data-testid` unless there is no accessible alternative.

### Tags and when to run

| Tag | Run command |
|---|---|
| `@smoke` | `playwright test --grep @smoke` |
| `@visual` | `pnpm e2e:visual` |
| `@live` | `playwright test --grep @live` (requires localstack) |
