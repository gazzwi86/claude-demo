# `.claude/skills/` — custom skills

Each subdirectory here defines a Claude Code skill — a packaged prompt
that the user can invoke with `/<skill-name>` or that Claude can invoke
itself when its trigger conditions match.

## Available skills

### Project skills (this repo)

| Skill | Trigger phrases | Purpose |
|---|---|---|
| `looper-add-effect/` | "add an effect", "add reverb/delay/filter", "add a new audio node" | Step-by-step guide for extending the Web Audio effects chain: types → engine → UI → aria. |
| `write-vitest-test/` | "write tests", "write unit tests", "add tests for X" | Guide for writing Vitest tests for API routes, services, and shared schemas. Uses `app.inject()` for routes. |
| `write-rtl-test/` | "write component test", "test this component", "add RTL test" | Guide for writing React Testing Library tests for `apps/web` components. Covers audio API mocking and accessible queries. |
| `write-playwright-test/` | "write E2E test", "add playwright test", "write an integration test for X" | Guide for writing Playwright specs. Covers behavioural (network-stubbed) and live (dev server) patterns. |
| `write-api-route/` | "add endpoint", "create route", "implement API for X", "add a new API route" | Full stack guide: shared schema → route → service → DB → test. Enforces HTTP status conventions. |
| `write-component/` | "create a component", "add UI component", "build a \<Name\> component" | Guide for scaffolding a React component: placement, props, accessibility, audio hooks, Tailwind tokens, RTL test. |
| `project-memory/` | `/remember`, "save this", "from now on" | Routes facts to project-memory or user-memory based on type. |

### Audit + scaffold skills (this repo's contribution)

| Skill | Purpose |
|---|---|
| `cc-audit/` + `cc-audit-<area>/` × 10 | Strict-by-default `.claude/` audit. Fans out per-area sub-skills, runs a council critique, emits a plan-mode diff bundle. |
| `cc-scaffold/` | Research-driven workflow scaffolder. Detects stack via context7 + WebSearch and proposes write-* skills, /open-pr, /check-health, agents. |

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
