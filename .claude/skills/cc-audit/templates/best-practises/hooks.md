# Hooks best practices

## Central dispatcher

One `hooks.py` (or `hooks.sh`) at `.claude/scripts/hooks.py`. Settings.json wires every event to:

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/scripts/hooks.py <event> [check]
```

Why: hook stdin contention when multiple hooks match the same tool — central dispatcher serialises them. One audit point. One log path. One version-control file.

## Exit codes

- `0` — success. Stdout JSON parsed for `hookSpecificOutput`.
- `2` — **block**. Stderr printed back to Claude.
- Any other — non-blocking. **`exit 1` does NOT block** (Unix convention is flipped).

## Hook events available

~25 events. The common ones: PreToolUse, PostToolUse, Notification, UserPromptSubmit, Stop, SubagentStop, PreCompact, SessionStart, SessionEnd. Plus: Setup, UserPromptExpansion, PostToolUseFailure, PostToolBatch, PermissionRequest, PermissionDenied, SubagentStart, TaskCreated, TaskCompleted, StopFailure, PostCompact, InstructionsLoaded, ConfigChange, CwdChanged, FileChanged, WorktreeCreate, WorktreeRemove, Elicitation, ElicitationResult.

## PreToolUse permission decision

`hookSpecificOutput.permissionDecision` ∈ `{allow, deny, ask, defer}`. Precedence: `deny > defer > ask > allow`.

## Matchers

Exact match for alphanumerics and `|`; regex otherwise. Word-boundary subtlety: `Bash(ls *)` matches `ls -la` but NOT `lsof`. The `:*` legacy syntax is deprecated — use ` *`.

## Token-conscious by default

Ship `type: command` hooks. Existing `type: prompt`/`agent`/`mcp_tool` hooks are flagged with token-cost estimates. Where a small LLM hook is genuinely useful, recommend `model: fast-model`, `timeout: 10`, hard-cap warning.

## Per-hook timeouts

- check-secrets: 5s
- pii-mask: 1s
- iac-deny: 2s
- async claude-review: 45s

## Output cap

Hook stdout JSON capped at 10,000 chars.

## `asyncRewake`

Background hooks can wake Claude on exit-2 with `asyncRewake: true`.

## Anti-patterns

- Hooks with network calls beyond locally-installed tools (gitleaks).
- Hooks that re-invoke `claude -p` for cheap checks.
- Hooks longer than 50 lines — split or move to a guard script.
- Hooks that log secrets (mask first).
