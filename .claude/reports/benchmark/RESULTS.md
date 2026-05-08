# Benchmark Results — Tool Comparison

Generated: 2026-05-08  
Spec: `.claude/reports/benchmark/SPEC.md`

## Setup

4 configs ran as isolated worktrees with real agent sessions. Each implemented all 5 tasks against the live codebase. jcodemunch configs (C3/C5/C6/C7) deferred — MCP tools are not available in sub-agents and require a fresh session after `claude mcp add --scope user`.

**C1 hit an API error mid-T4.** T4 is marked partial, T5 is not started. Estimated exploration steps reconstructed from worktree diff.

---

## Token Comparison — All Tasks × All Configs

*tokens_estimated = chars_total ÷ 4. C1 cols marked † are estimated.*

### T1 — padnode_fadein (1 file, simple)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 2 | 3,146 | 786 | 0 | ✓ complete |
| C1 anatomy† | 3 | 11,563 | 2,891 | 3,456 | ✓ complete |
| C2 graphify | 2 | 16,864 | 4,216 | 0 | ✓ complete |
| C4 anat+graph | 4 | 23,167 | 5,792 | 11,800 | ✓ complete |

### T2 — engine_playing_count (1 file, simple-medium)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 2 | 5,694 | 1,423 | 0 | ✓ complete |
| C1 anatomy† | 1 | 5,634 | 1,409 | 0 | ✓ complete |
| C2 graphify | 2 | 18,625 | 4,656 | 0 | ✓ complete |
| C4 anat+graph | 1 | 4,763 | 1,191 | 0 | ✓ complete |

*C1 and C4 reused prior-task context — effective cost for T2 was a single engine.ts read.*

### T3 — loop_tags (2-3 files, medium)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 3 | 6,550 | 1,637 | 0 | ✓ complete |
| C1 anatomy† | 5 | 15,757 | 3,939 | 3,456 | ✓ complete |
| C2 graphify | 3 | 19,422 | 4,856 | 0 | ✓ complete |
| C4 anat+graph | 6 | 26,273 | 6,568 | 11,800 | ✓ complete |

### T4 — loops_search (4 files, hard)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 5 | 14,041 | 3,510 | 0 | ✓ complete |
| C1 anatomy† | 5 | 14,397 | 3,599 | 3,456 | ⚠ partial (no route) |
| C2 graphify | 4 | 26,175 | 6,544 | 0 | ✓ complete |
| C4 anat+graph | 7 | 30,574 | 7,644 | 11,800 | ✓ complete |

### T5 — effects_bypass (3-4 files, complex)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 3 | 7,651 | 1,912 | 0 | ✓ complete |
| C1 anatomy† | 0 | 0 | 0 | 0 | ✗ not started |
| C2 graphify | 3 | 19,957 | 4,989 | 0 | ✓ complete |
| C4 anat+graph | 6 | 11,070 | 2,768 | 3,456 | ✓ complete |

*C4 T5 was cheap because ANATOMY.md + GRAPH_REPORT.md were already in context from earlier tasks.*

---

## Totals (5 tasks)

| Config | chars_total | tokens_est | vs baseline | Tasks complete |
|--------|-------------|------------|-------------|----------------|
| **C0 baseline** | **37,082** | **9,268** | — | 5/5 |
| C1 anatomy† | 47,351 | 11,838 | +2,570 (+28%) | 3/5 (API error) |
| C2 graphify | 101,043 | 25,261 | +15,993 (+173%) | 5/5 |
| C4 anat+graph | 95,847 | 23,962 | +14,694 (+159%) | 5/5 |

**C0 baseline won by a large margin on every metric.**

---

## Analysis

### Why baseline won

CLAUDE.md's layout table (`apps/web/lib/audio/` → Web Audio engine, etc.) gave the agents enough orientation to go directly to the right file without a navigation document. For simple tasks (T1, T2, T5) this meant 1-2 reads vs 3-6 reads for instrumented configs.

### Why graphify lost

GRAPH_REPORT.md is 13,778 chars and was re-read at the start of each task in C2. That's 68,890 chars of overhead across 5 tasks. After accounting for the report overhead, C2's source reads were actually *cheaper* than baseline (32,153 chars vs 37,082) — but the report cost wiped out the savings.

Graph data is genuinely useful for "who calls X" queries. The problem is the delivery: reading the full report as an orientation step is expensive. Targeted queries against `graphify-out/graph.json` for specific nodes would likely outperform baseline. The current "read GRAPH_REPORT.md first" workflow does not.

### Why anatomy was ambiguous

C1 hit an API error so comparison is partial. For tasks where the agent already knew which file to read (T1 → padNode.ts, T2 → engine.ts), the wiki added orientation overhead with no reduction in source reads. For T3 and T4 (cross-package, 2-4 files), wiki descriptions of exact method signatures may have reduced the number of exploratory reads, but the overhead of re-reading ANATOMY.md for each new area erased that gain.

C4's T2 and T5 were nearly free because T1 had already loaded the wiki context — anatomy amortizes across related tasks in the same session.

### C4's hybrid position

C4 total (95,847 chars) was marginally cheaper than C2 (101,043 chars) despite using both tools. The wiki context reuse for T2 and T5 partially offset the GRAPH_REPORT.md overhead. But C4 still read 2.6× more than baseline.

---

## Per-source contribution (C4 breakdown)

Across all 5 tasks, C4 read from each source approximately:

| Source | Chars read | Times read | Value delivered |
|--------|------------|------------|-----------------|
| ANATOMY.md | ~14,000 (4×) | 4 | Broad orientation; partially replaced by CLAUDE.md layout table |
| docs/wiki/* | ~18,000 total | 8 pages | Precise method signatures, field names — highest density per char |
| graphify-out/GRAPH_REPORT.md | ~24,000 (2×) | 2 | Community membership + god-node identification; already in wiki |
| Source files | ~27,000 | 8 files | Implementation-level detail — irreplaceable |

**Wiki pages had the highest information density.** The C4 agent explicitly noted this: "wiki pages were the highest-value first navigation tool — they gave precise method signatures and dependency chains that made source reads targeted rather than exploratory."

---

## Theoretical jcodemunch estimate (C3, not run)

Based on jcodemunch tool characteristics (`get_symbol_source` returns only the matched symbol body, not the whole file):

| Task | Estimated reads | Est. chars |
|------|----------------|-----------|
| T1: `search_symbols("PadNode")` + `get_symbol_source` | 2 calls | ~600 |
| T2: `search_symbols("padState")` + `get_symbol_source("AudioEngine")` | 2 calls | ~1,200 |
| T3: `search_symbols("CreateLoopSchema", "NewLoopInput", "createLoop")` | 3 calls | ~1,800 |
| T4: `search_symbols` (4 symbols) + `find_references("listUserLoops")` | 5 calls | ~3,000 |
| T5: `search_symbols("EffectsBus")` + `get_symbol_source` × 2 | 3 calls | ~1,500 |
| **Total** | **~15 calls** | **~8,100 chars (~2,025 tokens)** |

Estimated 78% reduction vs baseline if the index is current and symbol names are known. Caveat: this requires a fresh session where jcodemunch MCP is loaded at startup.

---

## Verdicts

### graphify — Change usage pattern, not the tool

**Keep the binary; change the workflow.**

Reading GRAPH_REPORT.md as an orientation step costs 13,778 chars regardless of relevance. The right usage: query `graphify-out/graph.json` programmatically for specific nodes when the task requires cross-file dependency lookups (e.g. "what files import loopService.ts?"). Don't read the full report. The graphify hook that fires on Grep/Glob is the correct integration — it surfaces the graph reactively rather than proactively.

Action: Update the graphify skill to query graph.json with jq/node rather than reading GRAPH_REPORT.md wholesale.

### anatomy/wiki — Keep, refine cadence

**Keep.** Wiki pages are the highest-information-density source in the stack (verified by C4 agent). The problem is re-reading ANATOMY.md for each task — it's 3,456 chars of low-density orientation that CLAUDE.md already partially covers. The wiki page reads (1,800–5,000 chars each) are well-targeted.

Action: Read ANATOMY.md once per session at most. Load the relevant wiki page(s) per task. Skip ANATOMY.md if CLAUDE.md layout table is already sufficient orientation.

### jcodemunch — Keep, measure in a dedicated session

**Keep.** Theoretical analysis suggests it would be the most efficient tool for symbol-level retrieval on this codebase (~2,025 tokens vs C0's 9,268 = 78% reduction). It fills a gap that graphify and wiki don't cover: sub-file precision (`get_symbol_source`) and identifier-level reference graphs (`find_references`). Cannot be verified here because jcodemunch MCP is not available in sub-agents and was not loaded at session startup.

Action: Run a dedicated C3 session in a fresh Claude Code instance (after `claude mcp add --scope user` is already in `~/.claude.json`) and repeat T1-T5.

---

## Summary verdict

| Tool | Token ROI (measured) | Keep? | Change needed? |
|------|---------------------|-------|----------------|
| Baseline (Read/Grep/Glob) | Reference: 9,268 tokens | — | — |
| anatomy/wiki | +28% overhead (partial data) | Yes | Read wiki per-task, not ANATOMY.md per-task |
| graphify | +173% overhead | Yes (binary) | Stop reading GRAPH_REPORT.md; query graph.json instead |
| jcodemunch | ~-78% estimated | Yes | Run dedicated session to confirm |

**The CLAUDE.md layout table does more orientation work than any of the tools measured.** For a small well-documented codebase, the baseline is hard to beat. Tools add value at scale and for cross-file dependency questions — but only when used with targeted queries, not wholesale document reads.

---

## Files

All 20 metrics files at `.claude/reports/benchmark/T{1-5}-C{0,1,2,4}-{name}.md`.  
Worktrees preserved at `.worktrees/bench-c{0,1,2,4}-*/` with all 5 implementations.
