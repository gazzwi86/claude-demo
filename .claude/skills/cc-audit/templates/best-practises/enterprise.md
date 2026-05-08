# Enterprise best practices

## Managed settings

Located at:
- macOS: `/Library/Application Support/ClaudeCode/`
- Linux: `/etc/claude-code/`
- Windows: `C:\Program Files\ClaudeCode\`

Managed settings cannot be overridden by user, project, or local settings. The audit detects them and reports "skipped: managed policy" for any finding that conflicts with a locked field.

## Login config

- `apiKeyHelper` — path to a script that emits the API key on stdout. Don't embed the key.
- `forceLoginMethod` — **string** `"claudeai"` or `"console"`, NOT array.
- `forceLoginOrgUUID` — **single UUID string**, not array.

## MCP allowlists

```jsonc
{
  "allowedMcpServers": ["server-name", "..."],
  "deniedMcpServers": ["bad-server"],
  "allowManagedMcpServersOnly": true,
  "strictKnownMarketplaces": true,
  "blockedMarketplaces": []
}
```

`strictKnownMarketplaces: true` guards against supply-chain risk from a new MCP server added between audits.

## Lockdown flags

- `allowManagedHooksOnly: true` — only managed-settings hooks run.
- `allowManagedPermissionRulesOnly: true` — only managed permission rules apply.
- `disableSkillShellExecution: true` — skill-defined `shell:` blocks are ignored. High-trust environments only.

## Company announcements

`companyAnnouncements: ["Note: this is a demo."]` shows on session start. Strip for OSS / public repos.

## Telemetry

Off by default. The audit's `--metrics` flag is opt-in and writes locally only — no network egress.
