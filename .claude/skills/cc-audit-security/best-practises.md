# Security audit best practices

See `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/best-practises/security.md` for the canonical reference.

## Ownership boundary

- **This skill** owns *content* of filesystem/secret-read denies, gitleaks status, PII masking, IaC enforcement.
- **`cc-audit-permissions`** owns allow/ask/deny *structure* (Bash baselines, asks, top-level shape).
- **`cc-audit-settings`** owns settings shape and self-mod guards (`Edit/Write` of `settings.json` and `hooks.py`).

## Audit checklist

- [ ] All filesystem-read denies present (`.env`, `~/.aws/**`, `~/.ssh/**`, `*.pem`, `*.key`, `secrets/**`).
- [ ] gitleaks binary recommended if absent.
- [ ] `guards/secret-scan.sh` exists and runs (regex fallback always active).
- [ ] Stop hook invokes `pii-mask`.
- [ ] PreToolUse:Bash invokes `check-iac-plan`.
- [ ] PreToolUse:Edit|Write invokes `check-secrets`.

## Council fix: regex fallback always active

Even when gitleaks is installed, the regex fallback runs as belt-and-braces. Coverage is intentionally redundant.
