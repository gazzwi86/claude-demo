## Junior dev (AI-naive) — Review

### Most important finding

C3b "winning" assumes I already know the symbol name. I usually don't. Without that, I'm back to C3 (search first), and nobody told me when to pick which.

### What's working

- C0 baseline just works. I open a file, Claude reads it. No setup.
- Quality verification (RESULTS table) is reassuring — every config produced the same edit, so I can't really break anything by picking wrong.

### What's broken or suboptimal

- F1 — `_freshness: stale_index` is invisible to me. I don't read MCP responses; if the index is stale and gives wrong code, I'd never notice until tests fail.
- F2 — auto-injected CLAUDE.md is "hidden cost." I don't see it, can't control it, and now it's a benchmark variable. Confusing.
- F4 — UI tasks need hybrid (jcodemunch + Read). Knowing when to mix tools is exactly the kind of judgement call I don't have.
- F5 — semble setup (uv, FAISS, pickle, 16s rebuild) is a lot. If I have to learn this per project, I won't.
- F7 — SPEC had stale paths nobody caught until C8 found them. Suggests indexes drift silently elsewhere too.

### Proposed changes (ranked by expected ROI)

1. Default to C3 (search first), promote to C3b only when CLAUDE.md names the symbol. Don't make me choose.
2. Auto re-index on `_freshness: stale_index` (F1). Hide the staleness problem from me entirely.
3. Drop semble from the recommended path until F5 scale-threshold is known. One tool less to learn.
4. Single "where is X" entry point — wiki vs ANATOMY vs graph.json vs jcodemunch is four answers to one question.

### Open questions

- Why does the index go stale at all? Why isn't it a file-watcher?
- If Claude can grep, why do I need an index?
- F6 says council is net-negative on a single run. Why are we running it?

### Tokens-spent (self-report)

- input_tokens: ~7,800
- output_tokens: ~430
- tool_call_tokens: ~200
- total: ~8,430
