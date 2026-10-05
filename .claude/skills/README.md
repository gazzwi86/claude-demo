# `.claude/skills/` — custom skills

Each subdirectory here defines a Claude Code skill — a packaged prompt
that the user can invoke with `/<skill-name>` or that Claude can invoke
itself when its trigger conditions match.

## Available skills

### Looper app skills

| Skill | Trigger phrases | Purpose |
|---|---|---|
| `looper-add-effect/` | "add an effect", "add reverb/delay/filter", "add a new audio node" | Step-by-step guide for extending the Web Audio effects chain: types → engine → UI → aria. |
| `write-api-route/` | "add endpoint", "create route", "implement API for X" | Full stack guide: shared schema → route → service → DB → test. Enforces HTTP status conventions. |
| `write-component/` | "create a component", "add UI component", "build a \<Name\> component" | Guide for scaffolding a React component: placement, props, accessibility, audio hooks, Tailwind tokens, RTL test. |
| `write-vitest-test/` | "write tests", "write unit tests", "add tests for X" | Guide for writing Vitest tests for API routes, services, and shared schemas. Uses `app.inject()` for routes. |
| `write-rtl-test/` | "write component test", "test this component", "add RTL test" | Guide for writing React Testing Library tests for `apps/web` components. Covers audio API mocking and accessible queries. |

### Playwright BDD E2E skills

| Skill | Trigger phrases | Purpose |
|---|---|---|
| `write-playwright-test/` | "write E2E test", "add playwright test", "write an integration test for X" | Entry point: guides through feature file → steps → page object → fixture for a full BDD scenario. |
| `write-feature-file/` | "write a feature file", "add BDD scenarios", "add Gherkin for X" | Write Gherkin feature files for `apps/web/e2e/features/`. |
| `write-step-file/` | "write step definitions", "implement steps for X", "add missing steps" | Wire Gherkin steps to Playwright actions in `apps/web/e2e/steps/`. |
| `write-page-object/` | "add a page object", "write a POM for X", "create a page class for X" | Scaffold Page Object Model classes in `apps/web/e2e/pages/`. |
| `write-e2e-fixture/` | "add an E2E fixture", "extend fixtures.ts", "share state across steps" | Extend the typed fixture file at `apps/web/e2e/fixtures.ts`. |

### Spec + product skills

| Skill | Trigger phrases | Purpose |
|---|---|---|
| `elicit/` | "explore requirements", "clarify scope", "I'm not sure what to build" | Structured MCQ-based requirements elicitation before committing to design. |
| `spec-writer/` | "write a spec", "create a PRD", "write user stories for X" | Writes Brief, PRD, and Epics section-by-section with HITL review. Used by `product-owner` agent. |
| `spec-review/` | "review the specs", "check if specs are ready", "validate the requirements" | Reviews Brief/PRD/Epics for completeness and implementation-readiness before technical design begins. |
| `generate-docs/` | "generate documentation", "create docs", "document this codebase" | Analyses codebase and generates README, architecture diagrams, module docs, API reference as a PR. |

### Security skills

| Skill | Trigger phrases | Purpose |
|---|---|---|
| `security-review/` | "review for security", "security audit", "check for vulnerabilities" | OWASP Top 10 scan: confidence-scored findings (≥ 0.8 only), exploit scenarios, writes `SECURITY_REPORT.md`. Used by `security-reviewer` agent. |
| `security-remediate/` | "/remediate VULN-001", "fix the security findings" | Applies targeted minimal fixes for specific VULN-NNN IDs from `SECURITY_REPORT.md`. Invoked after human triage. |

### Audit + scaffold skills

| Skill | Purpose |
|---|---|
| `cc-audit/` + `cc-audit-<area>/` × 10 | Strict-by-default `.claude/` audit. Fans out per-area sub-skills, runs a council critique, emits a plan-mode diff bundle. Areas: `claude-md`, `enterprise`, `git-hooks`, `hooks`, `monorepo`, `permissions`, `security`, `settings`, `skills`, `tools`. |
| `cc-scaffold/` | Research-driven workflow scaffolder. Detects stack via context7 + WebSearch and proposes write-* skills, /open-pr, /check-health, agents. |

### Memory + utility

| Skill | Trigger phrases | Purpose |
|---|---|---|
| `project-memory/` | `/remember`, "save this", "from now on" | Routes facts to project-memory or user-memory based on type. |

## Skill anatomy

A skill is a directory with at minimum:

```
.claude/skills/<name>/
└── SKILL.md
```

`SKILL.md` frontmatter:

```yaml
---
name: <name>
description: When to invoke this skill (used as the trigger description shown to Claude)
---
```

Body: the prompt + behaviour rules.

## How to add one

1. `mkdir .claude/skills/<name>` and write `SKILL.md` with the frontmatter
   above and a clear trigger description.
2. Body: instructions Claude will follow when the skill is invoked.
3. Optionally include scripts the skill calls (kept inside its own dir).
4. Test by typing `/<name>` and seeing whether Claude invokes the Skill tool.
