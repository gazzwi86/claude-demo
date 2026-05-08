# Permissions structure best practices

See `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/best-practises/permissions.md` for the canonical reference. This file is the audit-side companion.

## Ownership boundary

- **This skill** (`cc-audit-permissions`): allow/ask/deny **structure**, defaults, `additionalDirectories`, per-stack allow seeds.
- **`cc-audit-security`**: filesystem/secret-content denies (`.env`, `*.pem`, `~/.aws/**`).

Do not duplicate findings.

## Audit checklist

- [ ] Baseline always-allow present.
- [ ] Per-stack allow seeds present where stack detected.
- [ ] Baseline ask set present (push, rebase, publish, docker push, tf apply).
- [ ] Baseline deny set present (rm -rf, sudo, force-push, hard-reset, destroy commands).
- [ ] `defaultMode` set explicitly.
- [ ] No `Bash(*)` in allow.

## `--no-verify` lives in a hook

Deny-string for `--no-verify` would be too coarse. Use `guards/no-verify-deny.sh` (PreToolUse:Bash) instead.
