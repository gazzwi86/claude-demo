---
name: cc-audit-git-hooks
description: Audits git-hooks configuration. Checks core.hooksPath, pre-commit/pre-push presence and content, --no-verify deny hook, and Husky-collision detection (offers migrate-or-chain). Skipped if .git/ is absent. Use when the user invokes /cc-audit, asks to "wire git hooks", "review pre-commit / pre-push", "set core.hooksPath", or "migrate Husky".
when_to_use: Orchestrator fan-out for /cc-audit when .git is present, or a direct request to audit/scaffold git hooks.
allowed-tools: ["Read", "Glob", "Grep", "Bash"]
---

# cc-audit-git-hooks

Inspects `.git/`, `core.hooksPath`, existing hooks. **Skipped if `.git/` absent.**

## Run

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-git-hooks/inspect.py <repo-root> --json
```

## What it checks

- `.git/` present (else skip with reason "git not detected, skipping; rerun after `git init`").
- `core.hooksPath` set to `.claude/scripts/git-hooks` (or offer migration if Husky owns it).
- Pre-commit script: secret-scan via `guards/secret-scan.sh`.
- Pre-push script: lint + test gate.
- `--no-verify`/`-n`/`--no-gpg-sign` deny hook (`guards/no-verify-deny.sh`) wired in PreToolUse:Bash.
- Detects existing custom hooks; never silently overwrites — diff and propose merge.

## Husky collision

If `core.hooksPath` is `.husky` (or any non-cc-audit path), warn and offer:
1. Migrate Husky hooks into `.claude/scripts/git-hooks/` (preserving Husky logic).
2. Chain via wrapper script.
3. Skip git-hooks scaffolding.

Never silently overwrite.

## Why deny --no-verify via hook, not deny-string

Deny-string match for `--no-verify` would be too coarse (would match unrelated `-n` flags in non-git contexts). The hook (`guards/no-verify-deny.sh`) matches only `git commit -n` and explicit `--no-verify` / `--no-gpg-sign`.

## Gotchas

- Setting `core.hooksPath` is global to the repo — clobbering Husky surprises users.
- Pre-push needs to pass through to `git push` (not block dev push by default).
- `chmod +x` on hooks is required; bootstrap script handles this.

See [best-practises.md](best-practises.md).
