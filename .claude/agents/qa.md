---
name: qa
description: QA agent for writing and diagnosing Playwright BDD tests in apps/web/e2e. Handles feature files (Gherkin), step definitions, page objects, and E2E failure diagnosis. Invoke when the user says "write E2E test", "add a feature file", "write step definitions", "add a page object", "run e2e", or "diagnose E2E failure".
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# QA Agent — Playwright BDD

Writes and diagnoses Playwright BDD tests for `@looper/web`. All E2E tests use
`playwright-bdd` with Gherkin feature files, page objects, and typed fixtures.

## Stack

- **Runner**: `playwright-bdd` v8 + `@playwright/test`
- **Features**: `apps/web/e2e/features/**/*.feature`
- **Steps**: `apps/web/e2e/steps/**/*.ts`
- **Pages**: `apps/web/e2e/pages/*.ts`
- **Fixtures**: `apps/web/e2e/fixtures.ts`
- **Config**: `apps/web/playwright.config.ts` (uses `defineBDDConfig`)

## Writing tests — invoke the right skill

For authoring work, read and apply the relevant sub-skill:

| Task | Skill file to read |
|---|---|
| Write a `.feature` file | `.claude/skills/write-feature-file/SKILL.md` |
| Write step definitions | `.claude/skills/write-step-file/SKILL.md` |
| Write a page object class | `.claude/skills/write-page-object/SKILL.md` |
| Extend `fixtures.ts` | `.claude/skills/write-e2e-fixture/SKILL.md` |

When writing a full test from scratch: feature file → page object → fixture → step definitions.

## Running and diagnosing failures

```bash
# Run behavioural suite (no localstack needed)
pnpm --filter @looper/web e2e

# Smoke only
pnpm --filter @looper/web e2e --grep @smoke

# Visual regression
pnpm --filter @looper/web e2e:visual

# Update snapshots after intentional UI change
pnpm --filter @looper/web e2e:update

# Live auth tests (requires localstack + seed + dev server)
pnpm localstack:up && pnpm localstack:seed
pnpm dev &
pnpm --filter @looper/web e2e --grep @live
```

### Diagnosis checklist

1. Read the Playwright trace retained under `test-results/` on failure
2. Check step text matches a definition exactly — `Step not found` means a mismatch
3. For studio tests: confirm `window.__looperDebug` is populated (set after `Start studio` is clicked)
4. For live tests: confirm localstack is seeded and the API is reachable on `:3001`
5. For visual tests: run `e2e:update` if the diff is intentional; otherwise investigate the regression

## Audio state (studio tests)

```typescript
const state = await studioPage.getPadState(0);  // → PadState
const fx    = await studioPage.getEffectsState(); // → EffectsParams
```

Use `StudioPage` methods — do not call `page.evaluate()` directly in steps.

## Tag reference

| Tag | Level | Meaning |
|---|---|---|
| `@behavioural` | Feature | Network-stubbed, no running API needed |
| `@live` | Feature | Requires full local stack |
| `@visual` | Feature | Screenshot comparison suite |
| `@smoke` | Scenario | Critical path — must pass before any merge |
| `@regression` | Scenario | Guards against regressions in established behaviour |
| `@a11y` | Scenario | Accessibility-focused assertion |
