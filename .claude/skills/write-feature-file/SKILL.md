---
name: write-feature-file
description: Write a Gherkin feature file for apps/web/e2e. Invoke when the user says "write a feature file", "add BDD scenarios", "add Gherkin for X", or "write scenarios for X".
---

# Write a Gherkin feature file

Create `apps/web/e2e/features/<area>.feature`.

## Tag conventions

| Tag | Level | Meaning |
|---|---|---|
| `@behavioural` | Feature | Network-stubbed; no running API needed |
| `@live` | Feature | Requires full local stack |
| `@visual` | Feature | Screenshot comparison suite |
| `@smoke` | Scenario | Critical path — must pass before any merge |
| `@regression` | Scenario | Guards established behaviour |
| `@a11y` | Scenario | Accessibility-focused assertion |

Every `Feature` block **must** carry one of `@behavioural`, `@live`, or `@visual`.
Every `Scenario` **must** carry at least one of `@smoke`, `@regression`, or `@a11y`.

## Structure

- Group related scenarios under `Rule` blocks
- Use `Background` at both `Feature` and `Rule` level — they **stack** (Rule Background runs after Feature Background for every scenario in that rule)
- Steps describe intent, not implementation (`"I log in"`, not `"I fill the email field"`)
- Open each scenario with `Given`/`When`/`Then`; use `And`/`But` for continuation only

```gherkin
@behavioural
Feature: Widget interactions
  Short description of what this feature tests and how.

  Background:
    Given I am on the widget page

  Rule: Default state

    @smoke
    Scenario: Widget starts collapsed
      Then the widget panel is closed

    @a11y
    Scenario: Toggle is keyboard-accessible
      When I press Tab
      Then the toggle button has focus

  Rule: Expanded state

    Background:
      Given the widget is expanded

    @regression
    Scenario: Dismissing the panel closes it
      When I click Dismiss
      Then the widget panel is closed
      But no data is lost
```

## Checklist

- [ ] File is under `apps/web/e2e/features/`
- [ ] `Feature` block has a feature-level tag (`@behavioural`, `@live`, or `@visual`)
- [ ] Every `Scenario` has a scenario-level tag (`@smoke`, `@regression`, or `@a11y`)
- [ ] Related scenarios are grouped under `Rule` blocks
- [ ] Shared setup is in `Background` (feature and/or rule level)
- [ ] Steps match existing definitions in `apps/web/e2e/steps/` (or new ones are added via `/write-step-file`)
