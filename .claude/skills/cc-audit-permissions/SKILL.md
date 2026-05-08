---
name: cc-audit-permissions
description: Audits the structure of permissions.allow/ask/deny in .claude/settings.json. Owns shape, defaults, additionalDirectories, defaultMode, and per-stack seeded allows. Does NOT own filesystem-read or secret-path denies — those are owned by cc-audit-security. Use when the user invokes /cc-audit, asks to "review permissions structure", "audit allow/ask/deny shape", or "seed allow rules per stack".
when_to_use: Orchestrator fan-out for /cc-audit, or a direct request to review the shape of permissions rules.
allowed-tools: ["Read", "Glob", "Grep", "Bash"]
---

# cc-audit-permissions

Owns: **structure** of `permissions.{allow, ask, deny, additionalDirectories, defaultMode}`. Per-stack seeded allow lists.

Does **not** own filesystem-read denies (`.env`, `*.pem`, `~/.aws/**`, etc.) — that is `cc-audit-security`.

## Run

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-permissions/inspect.py <repo-root> --json
```

## What it checks

- Baseline allow seeds present (always: git status/diff/log, ls, cat, grep, rg, Read/Edit/Write).
- Per-stack seeds (Node/Python/Go/Rust/dbt) when stack detected.
- Baseline ask set: `git push *`, `git rebase *`, `npm publish *`, `docker push *`, `terraform apply *` (without `-auto-approve`).
- Baseline deny structure (`rm -rf *`, `sudo *`, `curl * | sh`, force pushes, hard resets, IaC destroys, `kubectl delete`, helm delete/uninstall, `aws/gcp/az delete`).
- `defaultMode` set to a known value (`default|acceptEdits|plan|auto|dontAsk|bypassPermissions`).
- Overly-broad `Bash(*)` warning.
- `additionalDirectories` shape and presence.

## Bash matcher subtleties

- `Bash(rm -rf *)` matches `rm -rf foo`, NOT `rm -rf` alone.
- `Bash(curl*)` matches `curl ...` AND `curlie`. Use `Bash(curl *)` for word-boundary.
- `:*` legacy syntax is deprecated in favour of ` *`.

## `--no-verify` is a hook, not a deny

The `--no-verify` / `-n` / `--no-gpg-sign` enforcement lives in `guards/no-verify-deny.sh` (PreToolUse:Bash hook). Deny strings would be too coarse (would match unrelated `-n` flags). This skill flags the absence of that hook and recommends installing it.

## Gotchas

- Deny wins over allow at all scopes. But some clients have enforcement gaps — defense-in-depth via PreToolUse hook.
- `Bash(*)` is too broad. Replace with explicit allows.
- Arrays concat+dedupe across scopes; an `~/.claude/settings.json` allow and a project deny still result in deny.

See [best-practises.md](best-practises.md).
