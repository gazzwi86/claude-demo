## Boris Cherney (Claude Code architect) — Review

### Most important finding

F1's `_freshness: stale_index` signal is the right primitive — a content_hash mismatch oracle that lets the harness gate re-indexing deterministically. F2 confirms what we suspected internally: CLAUDE.md auto-injection is a hidden, per-Read tax that asymmetrically inflates C0 totals because MCP responses bypass the auto-load path entirely.

### What's working

- jcodemunch index is genuinely warm across MCP calls — F3 shows direct-fetch (C3b) saves the ~530-char search step because the MCP server holds state across tool calls within a session.
- Quality decoupling (RESULTS line 42) — all 4 configs converged on identical edits across T1-T5. Confirms exploration cost is independent of edit quality at this scale.
- C8 was run as a Bash subprocess background sub-agent; SubagentStop context isolation held — semble totals never leaked into main-session token counts.

### What's broken or suboptimal

- F6: council overhead (~48k tokens) exceeds per-cycle savings (~13k). Without amortisation across ≥4 runs, council is net-negative — current `.claude/skills/benchmark-council/SKILL.md` does not gate on this.
- F2 honesty problem: C0 includes auto-injected CLAUDE.md but C3/C8 do not, because Read triggers the injection hook and MCP doesn't. This is a permission-model asymmetry, not a tool-quality difference. Reporting needs both views (line 72).
- F4: T5-C3 went +30 chars over C0. jcodemunch can't return JSX surrounding-context, so MCP-only configs fail on UI tasks. T5-C8-semble.md confirms chunk windows (effects.ts:1-41) miss class bodies entirely.
- F1 signal exists but is not surfaced — no hook, no settings.json gate, nothing in `.claude/settings.local.json` denies stale reads. Pure dead telemetry.
- S1/S4/S5 deferred (RESULTS line 104-106) — staleness SLA still unmeasured; the F1 oracle has no enforcement loop yet.

### Proposed changes (ranked by expected ROI)

1. PreToolUse hook on `mcp__jcodemunch__get_symbol_source` that reads `_freshness` from response and forces `index_folder { incremental: true }` on stale_index + content_hash mismatch. Closes F1. — token impact: −5% steady-state, −20% post-edit — effort: low
2. Make C3b the default in CLAUDE.md navigation rule when symbol is named in CLAUDE.md/wiki; fallback to C3 search otherwise (F3). — token impact: −15% on multi-file tasks — effort: low
3. Honest dual-reporting in RESULTS: split `chars_total` into `tool_returned` vs `auto_injected` so C0 vs MCP comparison is apples-to-apples (F2). — token impact: 0 (reporting only) — effort: low
4. Council-skip threshold in `benchmark-council/SKILL.md`: skip if `expected_savings < council_cost / 4` (F6). — token impact: −48k per skipped cycle — effort: med
5. UI-task hybrid pattern (F4): MCP for logic, Read for JSX. Document in `apps/web/CLAUDE.md`. — token impact: −5% on UI tasks — effort: low

### Open questions

- MCP handshake cost per tool call was never isolated — is the 280-char `resolve_repo` step (T1-C3 line 10) per-call or per-session? If per-call, C3 has hidden amortisation cost on short sessions.
- Does `register_edit` actually invalidate the in-memory index segment, or only mark stale? S4 not run, so unverified.
- Sub-agent context isolation only validated for one C8 spawn. Three concurrent sub-agents with overlapping tool calls = unmeasured.
- `settings.local.json` deny rules — never asserted as enforced inside the C8 Bash subprocess sub-agent. Worth a positive test (deny-rule + attempted-violation in sub-agent) before claiming the model holds.
- SPEC.md oracle drift (F7) suggests no pre-flight lint — should be a blocking hook, not a manual fix.

### Tokens-spent (self-report)

- input_tokens: ~14000
- output_tokens: ~750
- tool_call_tokens: ~600
- total: ~15350
