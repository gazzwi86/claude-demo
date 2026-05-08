---
description: Audit the current repo's Claude Code configuration against strict-by-default best practices, propose remediations, and (with --apply) scaffold the missing pieces.
argument-hint: "[--apply] [--lite] [--force] [--dry-run] [--metrics]"
---

Invoke the `cc-audit` skill.

Pass through any of the following flags from the user's invocation:
- `--apply` — remediate (default is plan-only).
- `--lite` — solo / throwaway-repo profile (lighter deny list, no PII guard, weaker IaC checks).
- `--force` — re-apply all template versions, ignoring `.applied.json` manifest.
- `--dry-run` — print the diff bundle without writing anything (works with or without `--apply`).
- `--metrics` — opt-in metrics logging at `.claude/logs/.metrics.jsonl`.

If the user passed no flags, run plan-only (the default). Read `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/SKILL.md` and follow its 7-step orchestration flow.
