# Enterprise audit best practices

See `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/best-practises/enterprise.md` for the canonical reference.

## Audit checklist

- [ ] `forceLoginMethod` is a string `"claudeai"` or `"console"` (not array).
- [ ] `forceLoginOrgUUID` is a single UUID string.
- [ ] `strictKnownMarketplaces: true`.
- [ ] Managed-settings dir presence checked; locked fields skipped.
- [ ] `apiKeyHelper` is a path to a script (not the key itself).

## Common mistakes

- `forceLoginMethod: ["claudeai"]` — array form fails silently.
- `forceLoginOrgUUID: ["uuid-1", "uuid-2"]` — only single string supported.
- `strictKnownMarketplaces` left absent → new MCP servers may slip in.
