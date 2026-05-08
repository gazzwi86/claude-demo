---
name: cc-audit-enterprise
description: Audits enterprise/managed-policy configuration. Checks managed-settings location, MCP allowlists (strictKnownMarketplaces, allowedMcpServers, allowManagedHooksOnly), and login config (apiKeyHelper, forceLoginMethod string, forceLoginOrgUUID single UUID). Skipped on --lite. Use when the user invokes /cc-audit on a team repo, asks to "review managed policy", "harden MCP allowlists", or "audit enterprise settings".
when_to_use: Orchestrator fan-out for /cc-audit unless --lite is selected, or a direct request to review enterprise/managed config.
allowed-tools: ["Read", "Glob", "Grep", "Bash"]
---

# cc-audit-enterprise

Inspects managed-settings location, MCP allowlist, and login config.

## Run

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-enterprise/inspect.py <repo-root> --json
```

**Skipped on `--lite`**: emits a single `skipped[]` entry with reason "lite profile; enterprise checks omitted".

## What it checks

- Managed-settings directory presence (read-only):
  - macOS: `/Library/Application Support/ClaudeCode/`
  - Linux: `/etc/claude-code/`
  - Windows: `C:\Program Files\ClaudeCode\`
- `apiKeyHelper` template (recommend; never embed secret).
- `forceLoginMethod` is a **string** (`"claudeai"|"console"`), NOT array — common confusion.
- `forceLoginOrgUUID` is a **single UUID string**, not array.
- `allowedMcpServers`, `deniedMcpServers`, `allowManagedMcpServersOnly`.
- `strictKnownMarketplaces: true` — supply-chain risk guard.
- `blockedMarketplaces`.
- `allowManagedHooksOnly`, `allowManagedPermissionRulesOnly`.
- `disableSkillShellExecution` for high-trust environments.
- Managed-settings respect: when locked, audit defers; reports "skipped: managed policy" per finding.

## OSS vs enterprise

For OSS / public repos: strip `companyAnnouncements`, skip `forceLoginOrgUUID`, ensure `.claude/settings.local.json` is gitignored, append CONTRIBUTING note. Detection: `LICENSE` + remote URL matches public host.

## Gotchas

- `forceLoginMethod` as an array fails silently → user not forced.
- `forceLoginOrgUUID` accepts only one org; for multi-org, document via team docs.
- A new MCP server added between audits is supply-chain risk — `strictKnownMarketplaces: true` defends.

See [best-practises.md](best-practises.md).
