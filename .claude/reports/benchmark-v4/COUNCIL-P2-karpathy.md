## Andrej Karpathy — Review

### Most important finding

F2 is the load-bearing result, not the headline. Auto-injected CLAUDE.md is ~3-5k chars *per Read* in C0. That's not "context" — that's a tax on every grep-and-read trajectory. C3/C3b dodge it by routing through MCP, which is why the −34/−44% gap exists. Strip auto-injection from C0 and the gap halves. Both views matter; the table should show both.

### What's working

C3b (F3): direct-fetch when symbol names are conventional. The 530-char search step is pure overhead — attention spent on a lookup the prior (CLAUDE.md, conventions) already pinned. Quality-decoupled-from-cost (RESULTS line 42) is the cleanest result here: identical diffs across all configs means exploration tokens past ~2k were wasted bits.

### What's broken or suboptimal

- F5 chunk granularity: 200-token windows over 281 chunks / 108 files = ~10 LOC/chunk. Too small to contain a symbol body, too large to be a precise pointer. 0/5 perfect chunk-line recall (RESULTS line 59) means semble is doing approximate file-routing, not retrieval. At 12k LOC the AST wins by construction.
- F6 council cost: 48k tokens to save 13k tokens/cycle. Net-negative until cycle 4. Defensible only if council findings *change architecture* (F2, F5 do). One-shot council = pure loss.
- F4 UI blind spot: AST returns symbol body, not the JSX scaffold. Predictable; needs a hybrid policy, not a fix.

### Proposed changes (ranked by expected ROI)

1. Report dual C0 numbers (with/without auto-injection). Honesty first.
2. Default to C3b; fall back to C3 only on guess-miss. Guard via CLAUDE.md symbol whitelist.
3. Bump semble chunk size to ~400-token symbol-aligned windows, top_k=2. Re-evaluate at >100k LOC only (F5).
4. Skip council below a savings/cycle threshold; require ≥3 amortizable findings to spawn (F6).
5. Lift F1 staleness oracle into a hook before next benchmark.

### Open questions

- Crossover LOC for AST vs embedding? Hypothesis: ~200k LOC, when index build > query latency budget.
- Does F2's auto-injection cost grow super-linearly with per-area CLAUDE.md count?
- Is C3b's "guessable symbol" rate a property of this repo's discipline, or transferable?

### Tokens-spent (self-report)

- input_tokens: ~9,800
- output_tokens: ~520
- tool_call_tokens: ~400
- total: ~10,720
