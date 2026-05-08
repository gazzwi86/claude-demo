---
description: Research-driven workflow scaffolder. Detects the project's stack, researches current best-practice via context7 + WebSearch, and scaffolds project-memory, /anatomy + docs/wiki, write-* skills, /open-pr / /check-health, and api-designer / test-writer subagents.
argument-hint: "[--cluster=memory|wiki|skills|commands|agents] [--dry-run] [--apply]"
---

Invoke the `cc-scaffold` skill.

Pass through any of the following flags from the user's invocation:

- `--cluster=<name>` — scaffold only the named cluster (`memory`, `wiki`, `skills`, `commands`, `agents`).
- `--dry-run` — print the diff bundle without writing anything.
- `--apply` — write proposed files with per-cluster confirmation.

If the user passed no flags, run plan-only (the default). Read
`${CLAUDE_PROJECT_DIR}/.claude/skills/cc-scaffold/SKILL.md` and follow
its 5-step orchestration flow.
