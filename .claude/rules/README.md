# `.claude/rules/` — cross-cutting conventions

Rules are short markdown files that Claude reads on every turn (in addition
to `CLAUDE.md`). They encode conventions that apply across files but don't
belong inside a single CLAUDE.md.

## Current rules

| File | Scope |
|---|---|
| [`code-style.md`](code-style.md) | 2-space indent, double quotes, `const` by default, max function length, etc. |
| [`testing.md`](testing.md) | Every new route → test file. Deterministic. Specific assertions. |
| [`security.md`](security.md) | No hardcoded secrets / tokens / passwords. No `eval()`. Validate input at route boundaries. |
| [`markdown.md`](markdown.md) | Markdown formatting conventions for docs in this repo. |

## Today's gap

These four rules are **flat** — they apply repo-wide. They don't encode
that:

- React components in `apps/web/components/` follow a different file convention than Fastify routes in `apps/api/src/routes/`.
- Tests in `apps/api/tests/` use `app.inject()` while tests in `apps/web/tests/` use `@testing-library/react`.
- Terraform in `infra/terraform/` wants snake_case + 2-space HCL — different from the TypeScript style.

A future iteration should add path-globbed rules (e.g.
`apps/web/components/*.tsx → component-style.md`) so each area gets only
the rules it cares about.

## How rules connect to other config

```
CLAUDE.md (top-level)         broad architecture + monorepo map
  └─ apps/<pkg>/CLAUDE.md      package-specific conventions
       └─ rules/<topic>.md     cross-cutting topic rules

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
2. Bullet the rules as imperative statements ("Use X", "Don't Y").
3. If the rule is mechanically checkable, add a hook in `../scripts/hooks.py`
   that enforces it; rule text becomes the explanation, hook becomes the gate.
