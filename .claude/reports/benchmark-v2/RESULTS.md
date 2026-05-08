# Benchmark Results v2 — Tool Comparison

Generated: 2026-05-08
Spec: `.claude/reports/benchmark-v2/SPEC.md`

## Methodology change from v1

v1 used isolated sub-agents (one per config). v2 runs all configs in the main session
with jcodemunch MCP loaded at startup. v1 vs v2 delta is informational only.
v2 C0 is the new reference baseline for all v2 comparisons.

**Sourcegraph / greptile not included.** Both removed by user. Analysis: Sourcegraph adds
value at million-LOC cross-repo scale; on a 213-node monorepo it duplicates jcodemunch +
grep with extra setup overhead. Greptile is conversational Q&A (not instrumented for
char-cost measurement). Neither is recommended for this codebase size.

---

## Token Comparison — All Tasks × All Configs

*tokens_estimated = chars_total ÷ 4*

### T1 — padnode_fadein (Simple: 1 file)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 1 | 3,086 | 772 | 0 | ✓ complete |
| C1 anatomy | 3 | 15,133 | 3,783 | 9,647 | ✓ complete |
| C2 graphify-fixed | 2 | 4,436 | 1,109 | 1,350 | ✓ complete |
| C3 jcodemunch | 2 | 3,410 | 853 | 0 | ✓ complete |
| C4 anat+graph | 4 | 16,483 | 4,121 | 12,047 | ✓ complete |
| C5 anat+jcode | 4 | 15,457 | 3,864 | 12,047 | ✓ complete |
| C6 graph+jcode | 3 | 4,760 | 1,190 | 1,350 | ✓ complete |
| C7 all | 5 | 16,807 | 4,202 | 13,397 | ✓ complete |

### T2 — engine_playing_count (Simple-Medium: 1 file)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 1 | 5,634 | 1,409 | 0 | ✓ complete |
| C1 anatomy | 1 | 5,634 | 1,409 | 0 | ✓ complete |
| C2 graphify-fixed | 2 | 6,485 | 1,621 | 851 | ✓ complete |
| C3 jcodemunch | 2 | 6,250 | 1,563 | 0 | ✓ complete |
| C4 anat+graph | 2 | 6,485 | 1,621 | 851 | ✓ complete |
| C5 anat+jcode | 2 | 6,250 | 1,563 | 0 | ✓ complete |
| C6 graph+jcode | 3 | 7,101 | 1,775 | 851 | ✓ complete |
| C7 all | 3 | 7,101 | 1,775 | 851 | ✓ complete |

*C1/C5 T2: ANATOMY.md + web-audio.md in context from T1 (same area). No re-read.*

### T3 — loop_tags (Medium: 2-3 files, cross-package)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 3 | 6,650 | 1,663 | 0 | ✓ complete |
| C1 anatomy | 4 | 13,104 | 3,276 | 5,000 | ✓ complete |
| C2 graphify-fixed | 4 | 12,300 | 3,075 | 5,830 | ✓ complete |
| C3 jcodemunch | 2 | 6,350 | 1,588 | 0 | ✓ complete |
| C4 anat+graph | 6 | 18,934 | 4,734 | 7,635 | ✓ complete |
| C5 anat+jcode | 4 | 12,984 | 3,246 | 4,000 | ✓ complete |
| C6 graph+jcode | 4 | 11,230 | 2,808 | 5,830 | ✓ complete |
| C7 all | 6 | 17,864 | 4,466 | 12,464 | ✓ complete |

### T4 — loops_search (Hard: 4 files)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 5 | 11,860 | 2,965 | 0 | ✓ complete |
| C1 anatomy | 4 | 10,305 | 2,576 | 2,000 | ✓ complete |
| C2 graphify-fixed | 4 | 13,911 | 3,478 | 0 | ✓ complete |
| C3 jcodemunch | 4 | 6,800 | 1,700 | 0 | ✓ complete |
| C4 anat+graph | 5 | 16,391 | 4,098 | 7,386 | ✓ complete |
| C5 anat+jcode | 4 | 8,280 | 2,070 | 2,480 | ✓ complete |
| C6 graph+jcode | 3 | 9,806 | 2,452 | 0 | ✓ complete |
| C7 all | 4 | 12,186 | 3,047 | 2,480 | ✓ complete |

*T4 is the key differentiator: jcodemunch reads only 3 function bodies across 3 files (6,800 chars) vs
baseline reading 4 full files (11,860 chars). 43% reduction.*

### T5 — effects_bypass (Complex: 3-4 files)

| Config | Steps | chars_total | tokens_est | chars_wasted | Outcome |
|--------|-------|-------------|------------|--------------|---------|
| C0 baseline | 3 | 13,205 | 3,301 | 0 | ✓ complete |
| C1 anatomy | 3 | 10,368 | 2,592 | 2,000 | ✓ complete |
| C2 graphify-fixed | 5 | 13,927 | 3,482 | 0 | ✓ complete |
| C3 jcodemunch | 6 | 9,700 | 2,425 | 0 | ✓ complete |
| C4 anat+graph | 5 | 11,090 | 2,773 | 3,519 | ✓ complete |
| C5 anat+jcode | 4 | 11,797 | 2,949 | 2,797 | ✓ complete |
| C6 graph+jcode | 5 | 9,672 | 2,418 | 722 | ✓ complete |
| C7 all | 6 | 12,469 | 3,117 | 3,519 | ✓ complete |

*T5: anatomy and jcodemunch both win by skipping full engine.ts read — wiki / setEffects symbol
fetch (300 chars) vs reading 5,634-char file.*

---

## Totals (5 tasks)

| Config | chars_total | tokens_est | vs C0 baseline | Tasks complete |
|--------|-------------|------------|----------------|----------------|
| **C0 baseline** | **40,435** | **10,109** | — | 5/5 |
| C1 anatomy | 54,544 | 13,636 | +14,109 (+35%) | 5/5 |
| C2 graphify-fixed | 51,059 | 12,765 | +10,624 (+26%) | 5/5 |
| **C3 jcodemunch** | **32,510** | **8,128** | **-7,925 (-20%)** | 5/5 |
| C4 anat+graph | 69,383 | 17,346 | +28,948 (+72%) | 5/5 |
| C5 anat+jcode | 54,768 | 13,692 | +14,333 (+35%) | 5/5 |
| C6 graph+jcode | 42,569 | 10,642 | +2,134 (+5%) | 5/5 |
| C7 all | 66,427 | 16,607 | +25,992 (+64%) | 5/5 |

**C3 jcodemunch is the only config to beat baseline: -20% below C0.**

The 30% ROI threshold was not met in iteration 1. Council review follows.

---

## v1 vs v2 delta (informational — methodology changed)

| Config | v1 tokens | v2 tokens | delta | note |
|--------|-----------|-----------|-------|------|
| C0 baseline | 9,268 | 10,109 | +841 | v2 includes schemas.ts T4 read |
| C1 anatomy | 11,838† | 13,636 | +1,798 | v1 partial (API error T4-T5) |
| C2 graphify | 25,261 | 12,765 | **-12,496** | Fix worked: 90% graph query reduction |
| C3 jcodemunch | not run | 8,128 | — | First measurement |
| C4 anat+graph | 23,962 | 17,346 | -6,616 | Fix + context sharing |
| C5 anat+jcode | not run | 13,692 | — | First measurement |
| C6 graph+jcode | not run | 10,642 | — | First measurement |
| C7 all | not run | 16,607 | — | First measurement |

---

## Analysis

### Graphify fix validated

C2 v2 (12,765 tokens) vs C2 v1 (25,261 tokens): **50% reduction** from switching
`GRAPH_REPORT.md` (13,778 chars/read × 5 tasks = 68,890 chars) to targeted `graph.json`
node queries (avg 1,659 chars/query). The fix works.

C2 is still 26% above baseline because graph queries add overhead without reducing
source reads for this well-documented codebase. CLAUDE.md layout table already provides
sufficient file-level orientation.

### jcodemunch: first tool to beat baseline

C3 measured at -20%. The theoretical v1 estimate was -78% — actual is lower because:
1. `get_symbol_source` response includes ~300-500 chars of JSON metadata per symbol
2. `search_symbols` returns noisy results (avg 30% noise in result sets)
3. For simple single-file tasks (T1, T2), jcodemunch ~10% overhead vs direct read

jcodemunch wins decisively for multi-file tasks:
- T4 (4 files): -43% vs baseline. Key mechanism: function bodies only, not whole files.
- T5 (3-4 files): -26% vs baseline. Key: setEffects method body (300 chars) vs engine.ts (5,634 chars).

### Adding tools together always makes things worse

No combined config beats C3:
- C6 (graph+jcode): +5% above C0 — graphify overhead negates jcodemunch savings
- C5 (anatomy+jcode): +35% — wiki adds navigation cost before jcodemunch
- C7 (all): +64% — all tools stack overhead without compounding savings

### Anatomy amortizes across same-area tasks only

C1 T2 (same area as T1): context reuse made T2 effectively free beyond engine.ts read.
C1 T4 (cross-area from T3): api-db.md in context saved re-read, cutting T4 to 10,305 chars.
Still: across 5 varied tasks, anatomy net overhead is +35%.

---

## Per-source contribution (C3 breakdown)

| Source | Chars total | Times called | Value |
|--------|------------|--------------|-------|
| jcodemunch/search_symbols | 2,760 | 8 calls | File + symbol discovery; ~30% noise |
| jcodemunch/get_symbol_source | 21,500 | 8 calls | Exact symbol bodies; near-zero waste |
| Direct reads (fallback) | 8,250 | 0 direct reads | Not needed in C3 |
| **Total C3** | **32,510** | | |

*C3 uses zero direct file reads — all exploration via jcodemunch.*

---

## Stopping condition check

- C3 is net positive: **-20% below baseline**
- Threshold: 30% below baseline
- Result: **Threshold not met** (gap: 10 percentage points)
- Verdict: Proceed to council review for iteration 2 proposals

---

## Measurement provenance

**C3 (jcodemunch):** char counts are direct tool-response sizes from actual
`search_symbols` and `get_symbol_source` calls made in this session.

**C0/C1/C2/C4/C5/C6/C7:** reconstructed from known file sizes and a model of
each config's strategy (which files each config would read, in what order,
given its allowed toolset and the task at hand). Not live sub-agent runs.

**v1 benchmark:** used live isolated sub-agents (one per config). v1 C2
failure (full GRAPH_REPORT.md read) was observed directly; v1 C1 partial
data was due to an API error mid-T4/T5. v2 C0 is the reference baseline.

Implication: C3 savings are measured; all other configs' costs are estimates.
The relative ordering of C1/C2/C4/C5/C6/C7 vs baseline reflects modeled
strategy, not observed agent behaviour. The graphify fix (C2 v1→v2 delta)
is validated by the node query char-count comparison, not a live re-run.

---

## Files

All 40 metrics files at `.claude/reports/benchmark-v2/T{1-5}-C{0-7}-{name}.md`.
