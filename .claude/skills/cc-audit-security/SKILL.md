---
name: cc-audit-security
description: Audits filesystem-read denies, secret-scanning posture, PII masking, and IaC plan-before-apply enforcement in .claude/. Owns the *content* of denies for filesystem and secret reads. Use when the user invokes /cc-audit, asks to "audit secrets posture", "review filesystem denies", "check PII masking", or "verify gitleaks/regex fallback configuration".
when_to_use: Orchestrator fan-out for /cc-audit, or a direct request to review secret-scanning, PII masking, or IaC enforcement.
allowed-tools: ["Read", "Glob", "Grep", "Bash"]
---

# cc-audit-security

Owns: **content** of denies for filesystem and secret reads. Secret-scan presence (gitleaks + regex fallback). PII masking on Stop hook. IaC plan-before-apply enforcement.

Does **not** own permissions structure (`cc-audit-permissions`) or settings shape (`cc-audit-settings`).

## Run

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-security/inspect.py <repo-root> --json
```

## What it checks

- Filesystem-read denies (content): `.env`, `.env.*`, `*.pem`, `*.key`, `~/.aws/**`, `~/.ssh/**`, `secrets/**`.
- Gitleaks binary presence — recommend if absent (do NOT auto-install).
- Regex fallback always active — never a "secret-scan-off" state (council fix).
- PII output masking on Stop hook (`guards/pii-mask.sh`).
- IaC plan-before-apply: `guards/iac-deny.sh` wired in PreToolUse:Bash hooks.

## Self-mod guards

These are owned by `cc-audit-settings` (settings shape). This skill does not duplicate them.

## Gotchas

- gitleaks is **recommended**, not required (hard requirement is too disruptive — council fix).
- Regex fallback covers eight canonical patterns: AWS access key, AWS secret heuristic, GitHub PAT, Slack token, JWT, private-key headers, generic API-key heuristic, credit card 13–19 digits + Luhn.
- PII masking is non-blocking. Logged findings get the same regex pass before write (`.metrics.jsonl`).

See [best-practises.md](best-practises.md).
