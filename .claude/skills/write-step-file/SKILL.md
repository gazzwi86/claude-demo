---
name: write-step-file
description: Write Playwright BDD step definitions for apps/web/e2e/steps. Invoke when the user says "write step definitions", "implement steps for X", "add missing steps", or "wire up Gherkin steps".
---

# Write step definitions

Step files live in `apps/web/e2e/steps/`. Name them `<area>.steps.ts` to match
the feature area (`auth.steps.ts`, `studio.steps.ts`, `visual.steps.ts`).

## Boilerplate

```typescript
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { test } from "../fixtures.js";

const { Given, When, Then } = createBdd(test);
```

`createBdd(test)` — always pass the project's custom `test` from `../fixtures.js`,
**not** the bare `test` from `playwright-bdd`. This is what makes page object
fixtures available inside step bodies.

## Writing steps

```typescript
Given("I am on the login page", async ({ loginPage }) => {
  await loginPage.goto();
});

When("I log in as {string} with password {string}", async ({ loginPage }, email, password) => {
  await loginPage.login(email, password);
});

Then("I am redirected to the studio", async ({ page }) => {
  await expect(page).toHaveURL("/studio");
});
```

- Use **Cucumber expressions** for parameters: `{string}`, `{int}`, `{float}`
- Steps shared across `Given`/`When` must be declared separately for each keyword
- Prefer page object methods over raw `page.*` calls inside step bodies
- Assertions belong in step bodies, never inside page objects

## Checking for existing steps

Before writing, grep for the step text:

```bash
grep -r "step text" apps/web/e2e/steps/
```

Reuse existing steps wherever the wording matches. Only add a new definition
if the step text is genuinely new.

## Checklist

- [ ] Import `createBdd` from `"playwright-bdd"` and `test` from `"../fixtures.js"`
- [ ] `createBdd(test)` — not `createBdd()` or `createBdd(base)`
- [ ] Cucumber expressions used for parameters, not regex captures
- [ ] Each keyword (`Given`/`When`/`Then`) declared separately where step text is shared
- [ ] Page object methods used — no bare `page.fill()` / `page.click()` in step bodies
- [ ] Assertions (`expect(...)`) only in step bodies, not page objects
