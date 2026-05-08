# `.claude/rules/` — cross-cutting conventions

Rules are short markdown files Claude reads on every turn alongside
`CLAUDE.md`. They encode conventions that apply across files but don't
belong inside a single CLAUDE.md.

## How `paths:` scoping works

Rules can carry a YAML frontmatter block with a `paths:` key. When present,
Claude only surfaces that rule when the **active file** matches one of the
glob patterns. Rules without `paths:` (or no frontmatter at all) are
**global** — they apply everywhere.

```markdown
---
name: Frontend Component Style
paths:
  - "src/components/**"
  - "*.tsx"
---
Rule content...
```

Path-scoped rules keep area-irrelevant conventions out of the context
window and prevent conflicting advice when working across stacks.

## Shipped rules

### Global (apply everywhere)

| File | Scope |
|---|---|
| `code-style.md` | Formatting and style baseline. |
| `security.md` | No hardcoded secrets / tokens / passwords. Input validation at boundaries. No `eval()`. |
| `testing.md` | Global fallback testing rules; points to area-specific files. |

### Path-scoped

| File | Paths | Scope |
|---|---|---|
| `markdown.md` | `docs/**`, `*.md` | Markdown formatting conventions. |

Stack-specific path-scoped rules (component conventions, route handler
shape, test-file rules) are not shipped as static templates because the
right tool, framework, and idioms depend on the detected stack. The
companion `cc-scaffold` skill researches the project's stack at apply
time and generates appropriate rule files.

## How rules connect to other config

```
CLAUDE.md (top-level)         broad architecture + monorepo map
  └─ apps/<pkg>/CLAUDE.md      package-specific conventions
       └─ rules/<topic>.md     cross-cutting topic rules (global or path-scoped)

settings.json hooks
  └─ scripts/hooks.py
       └─ modules/secrets.py   enforces parts of rules/security.md at
                               tool-call time (rules become tests)
```

Where possible, **encode a rule as a hook** — that way Claude can't forget
it. `modules/secrets.py` enforces the "no hardcoded secrets" rule from
`security.md` deterministically; the rule text is still useful as a
human-readable explanation, but the hook does the actual enforcement.

## How to add one

1. Drop a topic-named `.md` here. Lead with a one-line summary.
2. Add YAML frontmatter with `name:` and, if area-specific, `paths:`.
3. Bullet the rules as imperative statements ("Use X", "Don't Y").
4. If mechanically checkable, add a handler under
   `.claude/scripts/modules/<topic>.py` and register it in
   `hooks.py` — rule text becomes the explanation, hook becomes the gate.
5. Update the table above.
