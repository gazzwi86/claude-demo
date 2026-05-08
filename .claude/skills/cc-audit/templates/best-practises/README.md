# Best practices — Claude Code configuration

This directory holds **progressive-disclosure** docs cited by `/cc-audit` findings. Each page is a focused brief on one configuration area.

## Pages

- [claude-md.md](claude-md.md) — keeping CLAUDE.md lean, path-globbed rules, lifting verifiable rules into hooks
- [skills.md](skills.md) — frontmatter quality, body size, third-person descriptions
- [hooks.md](hooks.md) — central dispatcher, exit codes, token-conscious hook design
- [permissions.md](permissions.md) — allow/ask/deny structure, precedence, defaults
- [security.md](security.md) — secret scanning, PII masking, self-modification guards
- [iac.md](iac.md) — plan-before-apply, IaC denies, CDK/Terraform/Pulumi gates
- [enterprise.md](enterprise.md) — managed settings, MCP allowlists, login config
- [monorepo.md](monorepo.md) — per-area CLAUDE.md, path-globbed rules, deny-list union
- [.applied.json](.applied.json) — idempotency manifest (auto-managed)

## Idempotency

`.applied.json` records `{template, version, sha256}` for every file scaffolded by `bootstrap.sh`. Re-running `/cc-audit` shows drift between current and recorded state. `--force` ignores the manifest. Atomic writes via `.applied.json.tmp` + rename + flock.

## Telemetry

Off by default. `--metrics` enables append-only JSONL at `.claude/logs/.metrics.jsonl`. Same PII mask is applied to log entries before write. No network egress.
