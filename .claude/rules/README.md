# `.claude/rules/` — cross-cutting conventions

Rules are short markdown files that Claude reads on every turn (in addition
to `CLAUDE.md`). They encode conventions that apply across files but don't
belong inside a single CLAUDE.md.

## How `paths:` scoping works

Rules can carry a YAML frontmatter block with a `paths:` key. When present,
Claude only surfaces that rule when the **active file** matches one of the
glob patterns. Rules without `paths:` (or with no frontmatter at all) are
**global** — they apply everywhere.

```markdown
---
name: My Rule
paths:
  - "apps/web/**"
  - "*.tsx"
---
Rule content...
```

Global rules (no `paths:`) apply to every file in the repo. Path-scoped
rules only apply when the file being edited or reviewed matches a listed
glob. This keeps area-irrelevant conventions out of Claude's context window
and prevents conflicting advice.

## Current rules

### Global (apply everywhere)

| File | Scope |
|---|---|
| [`code-style.md`](code-style.md) | 2-space indent, double quotes, `const` by default, max function length, etc. |
| [`security.md`](security.md) | No hardcoded secrets / tokens / passwords. No `eval()`. Validate input at route boundaries. |
| [`testing.md`](testing.md) | Global fallback testing rules; points to area-specific files below. |

### Path-scoped

| File | Paths | Scope |
|---|---|---|
| [`markdown.md`](markdown.md) | `docs/**`, `*.md` | Markdown formatting conventions. |
| [`testing-fastify.md`](testing-fastify.md) | `apps/api/tests/**/*.test.ts` | Vitest + `app.inject()` for Fastify API tests. |
| [`testing-rtl.md`](testing-rtl.md) | `apps/web/**/*.test.tsx`, `apps/web/**/*.spec.tsx` | Vitest + RTL for React component tests. |
| [`frontend-component.md`](frontend-component.md) | `apps/web/components/**/*.tsx` | Named export, props interface, aria, Tailwind 4 tokens. |
| [`fastify-route.md`](fastify-route.md) | `apps/api/src/routes/**/*.ts` | Shared schemas, HTTP verbs, AppError, delegate to services. |

## How rules connect to other config

```
CLAUDE.md (top-level)         broad architecture + monorepo map
  └─ apps/<pkg>/CLAUDE.md      package-specific conventions
       └─ rules/<topic>.md     cross-cutting topic rules (global or path-scoped)

settings.json hooks
  └─ scripts/hooks.py
       └─ check_no_secrets    enforces parts of rules/security.md at
                              tool-call time (a few rules become tests)
```

Where possible, **encode a rule as a hook** — that way Claude can't forget
it. `check_no_secrets` enforces the "no hardcoded secrets" rule from
`security.md` deterministically; the rule text is still useful as a
human-readable explanation, but the hook does the actual enforcement.

## How to add one

1. Drop a topic-named `.md` here. Lead with a one-line summary.
2. Add YAML frontmatter with `name:` and, if area-specific, `paths:`.
3. Bullet the rules as imperative statements ("Use X", "Don't Y").
4. If the rule is mechanically checkable, add a hook in `../scripts/hooks.py`
   that enforces it; rule text becomes the explanation, hook becomes the gate.
5. Update the table above.
