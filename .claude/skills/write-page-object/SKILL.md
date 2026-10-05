---
name: write-page-object
description: Write a Playwright Page Object Model class for apps/web/e2e/pages. Invoke when the user says "add a page object", "write a POM for X", "encapsulate page X", or "create a page class for X".
---

# Write a page object

Page objects live in `apps/web/e2e/pages/<PageName>.ts`.

## Structure

```typescript
import type { Page } from "@playwright/test";

export class WidgetPage {
  constructor(readonly page: Page) {}

  // Actions — async methods
  async goto() {
    await this.page.goto("/widget");
  }

  async dismiss() {
    await this.toggleButton.click();
  }

  // Locators — get properties returning Locator (never ElementHandle)
  get panel() {
    return this.page.getByRole("region", { name: /Widget/ });
  }

  get toggleButton() {
    return this.page.getByRole("button", { name: /Toggle widget/i });
  }
}
```

### Rules

- Constructor takes `readonly page: Page` — nothing else
- **Actions** are `async` methods (`goto()`, `login()`, `submit()`, `blockApi()`)
- **Locators** are `get` properties that return `Locator` — never call `.click()` or `.fill()` inside them, never resolve to `ElementHandle`
- No assertions inside page objects — `expect(...)` belongs in step definitions
- Selector priority:
  1. `getByRole(role, { name: /label/i })` — ARIA role (preferred)
  2. `getByLabel(/label/i)` — form controls
  3. `getByText(/text/i)` — last resort
  - Never use CSS selectors or `data-testid` unless there is no accessible alternative

## Register the page object as a fixture

After creating the class, add it to `apps/web/e2e/fixtures.ts`:

**1. Import at the top:**

```typescript
import { WidgetPage } from "./pages/WidgetPage.js";
```

**2. Add to the `Fixtures` type:**

```typescript
type Fixtures = {
  // ... existing fixtures ...
  widgetPage: WidgetPage;
};
```

**3. Add the fixture implementation:**

```typescript
widgetPage: async ({ page }, use) => {
  await use(new WidgetPage(page));
},
```

See `/write-e2e-fixture` for the full fixture file pattern.

## Checklist

- [ ] File is under `apps/web/e2e/pages/`
- [ ] Constructor is `constructor(readonly page: Page) {}`
- [ ] Actions are `async` methods
- [ ] Locators are `get` properties returning `Locator`
- [ ] No assertions inside the class
- [ ] ARIA role-based selectors used throughout
- [ ] Class imported and registered in `apps/web/e2e/fixtures.ts`
