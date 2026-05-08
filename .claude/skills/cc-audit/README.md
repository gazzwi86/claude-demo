# cc-audit

Project-local Claude Code skill that audits any repo's `.claude/` configuration against a strict-by-default profile, scaffolds what's missing, and remediates drift.

## Install location

Lives in this repo at `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/` plus nine sibling skills `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-<area>/`. Slash command at `${CLAUDE_PROJECT_DIR}/.claude/commands/cc-audit.md`. The repo is both the source of truth for the patterns and the demo of them in action; future packaging into a plugin is a separate concern.

## What it does

Run `/cc-audit` from any repo. The skill:

1. Inspects the repo deterministically (languages, monorepo signals, OSS, managed policy, existing `.claude/`).
2. Interviews via ≤8 MCQ questions for ambiguous decisions.
3. Fans out 9 per-area subagents in parallel, each emitting Finding JSON.
4. Merges findings, dedupes cross-area concerns.
5. Runs a 5-persona council critique with structured `propose:{add,change,remove}` ops.
6. Emits a plan-mode diff bundle plus `<repo>/.claude/reports/CLAUDE-CONFIGURATION-AUDIT.md`.
7. With `--apply`, invokes `bootstrap.sh` (per-cluster confirmation, atomic backups, flock-protected manifest).

## Flags

- `--apply` — remediate (default plan-only).
- `--lite` — solo/throwaway profile.
- `--force` — re-apply ignoring manifest.
- `--dry-run` — print diff, write nothing.
- `--metrics` — opt-in JSONL telemetry at `.claude/logs/.metrics.jsonl`.

## Self-modification guard

The strict baseline denies `Edit/Write(./.claude/settings.json)` and `Edit/Write(./.claude/scripts/hooks.py)`. Bootstrap (a shell script invoked from outside the agent) writes those files; Claude in-session cannot. If a prompt injection succeeds in coercing Claude, the deny list still blocks the write.

## Idempotency manifest

`<repo>/.claude/best-practises/.applied.json` tracks template versions + SHA-256. Re-runs show drift. Manual edits are preserved unless `--force`.

## Upgrade path

When you bump `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/<file>` versions:
1. Re-run `/cc-audit` in target repos.
2. The orchestrator surfaces template drift as a focused upgrade plan.
3. Approve clusters per-template; user-edited divergence stays unless `--force`.

## Maintenance debt

The full capability is ~3-5k LOC of user-level config. The `.applied.json` manifest is the load-bearing piece — keep its schema stable. Templates have versions; SKILLs reference templates by path, never by hard-coded strings.

## Layout

```
~/.claude/
├── commands/cc-audit.md
└── skills/
    ├── cc-audit/
    │   ├── SKILL.md
    │   ├── README.md (this file)
    │   ├── bootstrap.sh
    │   ├── council.md
    │   ├── templates/
    │   │   ├── settings.baseline.json
    │   │   ├── hooks.py
    │   │   ├── statusline.sh
    │   │   ├── git-hooks/{pre-commit,pre-push}
    │   │   ├── guards/{secret-scan,pii-mask,iac-deny,no-verify-deny}.sh
    │   │   ├── rules/{code-style,testing,security}.md
    │   │   ├── claude-md.template
    │   │   └── best-practises/{README,claude-md,skills,hooks,permissions,security,iac,enterprise,monorepo}.md
    │   └── tests/run.sh
    └── cc-audit-{settings,claude-md,skills,hooks,permissions,security,git-hooks,enterprise,monorepo}/
        ├── SKILL.md
        ├── inspect.py
        └── best-practises.md
```
