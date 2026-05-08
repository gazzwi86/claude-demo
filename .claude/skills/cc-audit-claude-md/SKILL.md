---
name: cc-audit-claude-md
description: Audits CLAUDE.md files for size, structure, and verifiable rules that should be lifted into hooks. Detects bloated CLAUDE.md (Anthropic warns it gets ignored), proposes cluster-and-extract into .claude/rules/<topic>.md with paths globs, and identifies rules that can be enforced deterministically as PostToolUse / Stop hooks. Use when the user invokes /cc-audit, asks to "review CLAUDE.md", "split CLAUDE.md", "extract rules with paths globs", or "lift verifiable rules into hooks".
when_to_use: Orchestrator fan-out for /cc-audit, or a direct request to review CLAUDE.md size, structure, or rule-lift opportunities.
allowed-tools: ["Read", "Glob", "Grep", "Bash"]
---

# cc-audit-claude-md

Inspects top-level `CLAUDE.md`, per-folder `CLAUDE.md` files, and `.claude/rules/*.md`.

## Run

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-claude-md/inspect.py <repo-root> --json
```

## What it checks

- Top-level CLAUDE.md ≤100 lines.
- Per-folder CLAUDE.md ≤200 lines.
- `.claude/rules/*.md` have `paths:` glob frontmatter.
- Verifiable rules (cyclomatic complexity, "tests must pass", "no console.log") that should be lifted into hooks.
- "Would removing this make Claude make mistakes?" test — flag cosmetic/redundant content.

## Cluster-and-extract pattern

When CLAUDE.md exceeds budget:
1. Cluster by markdown heading.
2. Per-cluster, propose `.claude/rules/<topic>.md` with `paths:` glob.
3. Folder-mention clusters → propose `apps/<area>/CLAUDE.md` extraction.
4. Top-level becomes navigation index.

## Verifiable-rule lift

| Rule | Hook |
|---|---|
| "Cyclomatic complexity must be <10" | `PostToolUse:Edit` running `eslint --rule complexity` |
| "All tests must pass before merging" | `Stop` running `npm test` if changed files include test paths |
| "No console.log in src/" | `PostToolUse:Edit\|Write` regex check |

## Gotchas

- Boris/Anthropic: bloated CLAUDE.md gets *ignored*. Size budgets are not aspirational — they're enforcement.
- Per-package CLAUDE.md files override the global rules; don't duplicate guidance up.
- `paths:` globbed rules only load when matching files are touched — far more efficient than top-level guidance.

See [best-practises.md](best-practises.md).
