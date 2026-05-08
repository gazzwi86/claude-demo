# S5 — Multi-session loop (handoff doc)

Status: **NOT RUN in v4.** Sub-agent proxy is too weak; deferred to a real
multi-session run by the user.

## Why sub-agent proxy fails for S5

PLAN.md S5 spec demands "Open fresh session B" / "Open fresh session C". A sub-agent
spawned via the Agent tool is not a fresh session:

1. **MCP not inherited.** Sub-agents cannot call `mcp__jcodemunch__*` tools. Sub-agent
   S5 can only measure C0 across "sessions" — and C0 was never the interesting one.
2. **SessionStart hooks don't fire.** No CLAUDE.md auto-injection cost test, no
   memory re-load, no `inject_memory_index` from `.claude/memory/`. The token
   profile is fundamentally different.
3. **Index state is shared.** The same `~/.code-index/local-claude-demo-*.db` lives
   across the parent + sub-agents. There is no way to simulate the cold-start cost
   of "the index doesn't exist on this machine yet" from inside a single Claude
   session.
4. **Context-window state.** Each sub-agent gets its own context but shares the
   parent's tool result history concept; a real multi-session test would have
   compaction artifacts and persisted-memory drift the sub-agent can't model.

## Proper S5 protocol (manual handoff)

Run this across 3 real Claude Code sessions over (e.g.) 3 days:

### Day 0 — session A (cold install)
```
1. rm -rf ~/.code-index/local-claude-demo-*  (force cold)
2. Start a fresh `claude` session in /Users/gareth/Sites/claude-demo
3. Run /benchmark-council for T1-T5 in C0 + C3 + C3b modes
4. Record results to .claude/reports/benchmark-v5/A-T*.md
5. Make 5 commits to apps/web/lib/audio/* (random unrelated edits) — simulate drift
6. /exit (clean session close)
```

### Day 1 — session B (cold restart, same index)
```
1. Do NOT rm ~/.code-index — keep stale state
2. Fresh `claude` session
3. Run /benchmark-council for T1-T5 in C0 + C3 + C3b modes WITHOUT calling index_folder
4. Record to .claude/reports/benchmark-v5/B-T*.md
5. Compare: did C3/C3b oracle_pass go down vs A? Did chars_total change?
6. Make 5 more commits
7. /exit
```

### Day 2 — session C (fresh re-index)
```
1. Fresh session
2. Call index_folder { incremental: true } before any tasks
3. Re-run T1-T5
4. Record to .claude/reports/benchmark-v5/C-T*.md
5. Compare: did re-indexing recover C3/C3b's quality? What was the rebuild time?
```

### Analysis
- Plot oracle_pass rate vs commits-since-reindex
- Establish re-index SLA: "C3 quality drops below C0 after N commits without re-index"
- Use SLA to wire the F1 staleness hook (PostToolUse Edit|Write)

## Why this is worth doing

The whole F1 staleness conversation depends on knowing the answer to:
*"How many commits can pile up before C3 starts producing wrong code in production?"*

Council P4 (senior dev) flagged this as the single biggest unmeasured risk. Without
S5, the F1 hook proposal is calibrated by guesswork. With S5, you get a defensible
SLA you can put in a hook config and a CI job.

## Estimated cost

- Each session: ~30 min wall + ~30k tokens (T1-T5 across 3 configs)
- 3 sessions × ~30k = ~90k tokens for the full S5 measurement
- Fits within one normal day's worth of agent work
