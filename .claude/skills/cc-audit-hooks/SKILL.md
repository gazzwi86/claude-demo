---
name: cc-audit-hooks
description: Audits hook configuration in .claude/settings.json and the hook scripts they invoke. Checks for central-dispatcher convention, exit-code correctness (exit 1 does NOT block; only exit 2 does), per-hook timeouts, and token cost of any prompt/agent/mcp_tool hooks. Recommends matchers and lists all 25+ hook events. Use when the user invokes /cc-audit, asks to "review hooks", "audit hook scripts", "check hook timeouts", or "estimate hook token cost".
when_to_use: Orchestrator fan-out for /cc-audit, or a direct request to review hooks configuration.
allowed-tools: ["Read", "Glob", "Grep", "Bash"]
---

# cc-audit-hooks

Inspects `settings.json.hooks` and the scripts they invoke.

## Run

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-hooks/inspect.py <repo-root> --json
```

## What it checks

- Central-dispatcher convention (`hooks.py` pattern). Migrate scattered hooks into the dispatcher; never delete custom logic — wrap and migrate.
- Zero-LLM hooks default. Flag and emit token-cost-estimate (chars/4 heuristic) for any `type: prompt`/`agent`/`mcp_tool` hook.
- Recommended matchers: exact match for alphanumerics + `|`; regex otherwise. Word-boundary subtlety: `Bash(ls *)` matches `ls -la` but not `lsof`.
- PreCompact / Stop usage opportunities.
- Per-hook timeouts: check-secrets 5s, pii-mask 1s, iac-deny 2s, async claude-review 45s.
- Exit-code semantics: `0`=success, `2`=block, others non-blocking. **Exit `1` does NOT block** (Unix convention is flipped).
- JSON output cap: 10,000 chars.

## Hook events (cite-able list)

PreToolUse, PostToolUse, Notification, UserPromptSubmit, Stop, SubagentStop, PreCompact, SessionStart, SessionEnd, Setup, UserPromptExpansion, PostToolUseFailure, PostToolBatch, PermissionRequest, PermissionDenied, SubagentStart, TaskCreated, TaskCompleted, StopFailure, PostCompact, InstructionsLoaded, ConfigChange, CwdChanged, FileChanged, WorktreeCreate, WorktreeRemove, Elicitation, ElicitationResult.

## Gotchas

- `exit 1` does NOT block — only `exit 2` blocks. Easy to miss.
- Multiple hooks on same matcher → stdin contention. Central dispatcher fixes this.
- `type: prompt` hooks fire `claude -p`-equivalents → token bill. Flag with daily-cost estimate where transcript JSONL allows.
- `asyncRewake: true` lets background hooks wake Claude on exit-2.

See [best-practises.md](best-practises.md).
