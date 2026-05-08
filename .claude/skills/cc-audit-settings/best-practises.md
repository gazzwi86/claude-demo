# Settings best practices

## Precedence

Managed > CLI args > `.claude/settings.local.json` > `.claude/settings.json` > `~/.claude/settings.json`.

Arrays concat+dedupe; objects deep-merge; scalars override. Managed cannot be overridden.

## Required keys (strict baseline)

| Key | Purpose |
|---|---|
| `plansDirectory` | Where plan-mode plans persist |
| `statusLine` | Status bar text command |
| `attribution.commit` / `.pr` | Co-author trailer + PR footer |
| `strictKnownMarketplaces` | Block unknown MCP marketplaces |

## Self-mod guards

```
"Edit(./.claude/settings.json)",
"Write(./.claude/settings.json)",
"Edit(./.claude/scripts/hooks.py)",
"Write(./.claude/scripts/hooks.py)"
```

These deny rules MUST live in `permissions.deny` of the project's settings. Bootstrap script applies updates from outside the agent.

## Gotchas

- `forceLoginMethod` is a string (`"claudeai"` or `"console"`), NOT an array.
- `forceLoginOrgUUID` is a single UUID string.
- Some clients have `permissions.deny` enforcement gaps. The baseline backs every critical deny with a PreToolUse hook (defense-in-depth).

## Managed policy

When detected, audit defers to managed values. Locked findings show as `skipped: managed policy locks this field`.
