---
name: cc-audit-settings
description: Audits .claude/settings.json against the strict-by-default Claude Code baseline. Checks precedence-aware settings shape, missing baseline keys (plansDirectory, statusLine, attribution, strictKnownMarketplaces), self-modification guards, and managed-policy interactions. Use when the user invokes /cc-audit, asks to "review .claude/settings.json", "check Claude Code settings shape", or "audit settings precedence". Returns Finding JSON for the orchestrator to merge.
when_to_use: Orchestrator fan-out for /cc-audit, or direct request to review settings.json structure or precedence.
allowed-tools: ["Read", "Glob", "Grep", "Bash"]
---

# cc-audit-settings

Inspects `.claude/settings.json` (and `~/.claude/settings.json` read-only) for the strict-by-default profile.

## Run

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-settings/inspect.py <repo-root> --json
```

Outputs Finding JSON to stdout per the shared schema (`area`, `version: "v1"`, `findings[]`, `skipped[]`).

## What it checks

- Presence of baseline keys: `plansDirectory`, `statusLine`, `attribution`, `strictKnownMarketplaces`.
- Self-mod guards in `permissions.deny`: `Edit/Write(./.claude/settings.json)` and `Edit/Write(./.claude/scripts/hooks.py)`.
- `.claude/settings.local.json` is gitignored.
- `companyAnnouncements` stripped on OSS.
- `outputStyle`, `model`, `defaultMode` present and reasonable.
- Managed-policy detection: don't propose changes to locked fields; emit `skipped[]` instead.

## Ownership boundary

This skill owns settings **shape** and missing keys. `cc-audit-permissions` owns allow/ask/deny **structure**. `cc-audit-security` owns the *content* of denies relating to filesystem/secret reads. Do not duplicate findings.

## Precedence (cite-able)

Managed > CLI args > `.claude/settings.local.json` > `.claude/settings.json` > `~/.claude/settings.json`. Arrays concat+dedupe; objects deep-merge; scalars override; managed cannot be overridden. See `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/best-practises/permissions.md`.

## Cite-able settings keys

`permissions{allow,ask,deny,additionalDirectories,defaultMode}`, `hooks`, `statusLine`, `apiKeyHelper`, `forceLoginMethod` (string), `forceLoginOrgUUID` (single UUID), `model`, `outputStyle`, `plansDirectory`, `sandbox{...}`, `autoMemoryEnabled`, `companyAnnouncements`, `allowedMcpServers`, `deniedMcpServers`, `allowManagedMcpServersOnly`, `strictKnownMarketplaces`, `blockedMarketplaces`, `allowManagedHooksOnly`, `allowManagedPermissionRulesOnly`, `disableSkillShellExecution`, `attribution{commit,pr}`, `env`, `mcpServers`, `disableAllHooks`, `allowedHttpHookUrls`, `httpHookAllowedEnvVars`.

## Gotchas

- Some clients have permissions.deny enforcement gaps — back deny rules with PreToolUse hooks (defense-in-depth).
- `forceLoginMethod` is a string, not array — common confusion.
- `/config` writes persist to user settings; settings precedence applies.

See [best-practises.md](best-practises.md).
