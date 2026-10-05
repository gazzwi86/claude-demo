---
name: write-playwright-test
description: Guide for writing Playwright BDD E2E tests for apps/web. Uses playwright-bdd with Gherkin feature files, page objects, and typed fixtures. Invoke when the user says "write E2E test", "add playwright test", "write an integration test for X", "add a feature file", or "add a browser test".
---

# Write a Playwright BDD test

All E2E tests use `playwright-bdd` with Gherkin `.feature` files, Page Object Model
classes, typed fixtures, and step definition files.

For unit/API tests use `/write-vitest-test`. For component tests use `/write-rtl-test`.

## File layout

```
apps/web/e2e/
├── features/          ← Gherkin feature files    → /write-feature-file
├── steps/             ← Step definitions          → /write-step-file
├── pages/             ← Page Object Model classes → /write-page-object
└── fixtures.ts        ← Typed fixture extensions  → /write-e2e-fixture
```

## Routing to sub-skills

Invoke the matching sub-skill for the artifact you need to create:

| Task | Skill |
|---|---|
| New `.feature` file (Gherkin scenarios, tags, Rule/Background blocks) | `/write-feature-file` |
| Step definitions (`Given`/`When`/`Then` in `steps/*.steps.ts`) | `/write-step-file` |
| Page Object class (`pages/*.ts`, actions + locators) | `/write-page-object` |
| New fixture or extending `fixtures.ts` | `/write-e2e-fixture` |

When writing a complete test from scratch, invoke the sub-skills in order:
1. `/write-feature-file` — define the scenarios
2. `/write-page-object` — encapsulate the page under test
3. `/write-e2e-fixture` — register the page object as a fixture
4. `/write-step-file` — implement the step definitions

## Running tests

```bash
pnpm --filter @looper/web e2e                   # behavioural (stubbed)
pnpm --filter @looper/web e2e --grep @smoke     # smoke only
pnpm --filter @looper/web e2e:visual            # visual regression
pnpm --filter @looper/web e2e:update            # refresh snapshots
pnpm --filter @looper/web e2e --grep @live      # live (requires localstack)
```
