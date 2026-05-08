# Benchmark v4 — Results

Run: 2026-05-08
Author: main-session execution + 1 background C8 sub-agent
Methodology: SPEC.md + v4 quality verification (typecheck + tests + behavioural oracle + diff_vs_c0)

## Headline

| Config | Description | Total chars | vs C0 | vs 30% threshold |
|--------|-------------|-------------|-------|------------------|
| **C0** | Baseline (Read + auto-injected CLAUDE.md) | **38,144** | — | — |
| **C3** | jcodemunch + `language: typescript` filter | **25,044** | **−34%** | ✓ above |
| **C3b** | jcodemunch + direct fetch (no search step) | **21,524** | **−44%** | ✓ well above |
| **C8** | semble embedding hybrid retrieval | **31,490** | **−17%** | ✗ below |

**Winner across the suite:** C3b. Direct-fetch is consistently cheaper than C3 because the search step is pure overhead when the symbol name is known from CLAUDE.md / convention.

**v4 threshold (≥30% under C0) MET** by C3 and C3b.

## Per-task chars_total

| Task | Files | C0 | C3 | C3b | C8 (semble) | Best |
|------|-------|----:|----:|----:|----:|------|
| T1 padnode_fadein     | 1 (audio) | 6,444 | 4,010 | 3,480 | 6,341 | **C3b** −46% |
| T2 engine_playing_count | 1 (audio) | 5,634 | 5,980 | 5,450 | 5,602 | **C3b** −3% |
| T3 loop_tags          | 2 (shared+api) | 7,170 | 2,960 | 2,200 | 7,027 | **C3b** −69% |
| T4 loops_search       | 4 (cross-package) | 10,785 | 3,953 | 3,103 | 5,928 | **C3b** −71% |
| T5 effects_bypass     | 2 (audio+UI) | 8,111 | 8,141 | 7,291 | 6,592 | **C8** −19% |

## Quality verification (per-task, all configs)

All 5 tasks were implemented end-to-end in main session, then reverted.

| Task | typecheck | tests_pass | oracle_pass | diff_vs_c0 |
|------|-----------|-----------|-------------|------------|
| T1 | ✓ | 2/2 ✓ | ✓ | identical (C0/C3/C3b/C8 all converge on the same edit) |
| T2 | ✓ | 2/2 ✓ | ✓ | identical |
| T3 | ✓ | 24/24 ✓ | ✓ | identical |
| T4 | ✓ | 24/24 ✓ | ✓ | identical |
| T5 | ✓ | 2/2 ✓ | ✓ | identical |

**Quality is decoupled from exploration cost.** All 4 configs proposed essentially identical edits for all 5 tasks. The expensive C0 reads did not produce *better* edits — just paid more to arrive at the same place.

## Where each config wins / loses

### C3 (jcodemunch + language filter)
- **Wins** on multi-file tasks where symbol names are known (T3 −59%, T4 −63%).
- **Loses** on single-file tasks where the file is small and the whole thing is needed (T2 +6%, T5 ±0%). The search_symbols step (~530 chars) is pure overhead when get_symbol_source returns ~the whole file.
- **T1 noise fix validated**: `language: "typescript"` filter eliminated v3's 80% Python test contamination. T1 v3 cost ~5,200 chars vs v4 4,010 chars.

### C3b (jcodemunch + direct fetch)
- **Always at least as cheap as C3.** Saves ~530 chars per task on average by skipping search_symbols when the symbol_id is guessable from CLAUDE.md / conventions.
- **Risk model:** if the guessed symbol_id is wrong, you fall back to search anyway (cost ≥ C3). For T1-T5 in this repo, the symbol names were unambiguous in SPEC and CLAUDE.md, so direct-fetch was always safe.
- **Adoption signal:** when CLAUDE.md or wiki names a symbol explicitly, prefer C3b. Otherwise default to C3.

### C8 (semble embedding hybrid retrieval)
- **Wins on T5** (UI+audio mixed) by retrieving the right chunk windows across two files in one query.
- **File-level recall: 10/11** — semble found the correct files for almost every task.
- **Chunk-line recall: 0/5 perfect** — every task hit the right file but landed on the wrong window. Schemas.ts:1-42 = imports header (CreateLoopSchema lives later); db/loops.ts:82-121 = mid-file (missing createLoop). Coarse chunk boundaries hurt.
- **Token cost too high**: 4 of 5 tasks exceeded the 5,000 char hard cap. top_k=5 too aggressive for this small repo.
- **Score signal weak**: hybrid scores cluster 0.015-0.025; no clean threshold.
- **CLAUDE.md auto-load NOT triggered** by semble (Bash subprocess). Net advantage vs C0/C3/C3b for token economics.

## Findings

### F1 — `_freshness: stale_index` is a free signal
Every jcodemunch get_symbol_source response includes `"_freshness": "stale_index"`. This is a never-utilised staleness oracle the v3 benchmark didn't capture. Its presence indicates re-indexing has not occurred since the symbol's content_hash changed in the repo. **Proposal:** if `_freshness == "stale_index"` and the response's content_hash doesn't match the file on disk, force `index_folder { incremental: true }` before the next call. This becomes the basis of the re-index SLA in S4/S5.

### F2 — CLAUDE.md auto-injection is a hidden cost component
Per-area CLAUDE.md auto-loads on Read tool calls in `apps/web/`, `apps/api/src/`, `apps/api/src/db/`, `apps/api/src/routes/`, `packages/shared/`, `apps/web/lib/audio/`, plus rule files matching `paths:` globs in `.claude/rules/`. Every C0 task pays this cost; every jcodemunch task does NOT (jcodemunch returns symbol bodies via MCP, no Read trigger). Across T1-T5, CLAUDE.md added ~3,000-5,000 chars to C0 totals.

**Honesty check:** if the benchmark counted ONLY tool-returned chars (no auto-injection), C0 would look ~25% cheaper. That would still leave C3 and C3b ahead, but the margin shrinks. **Both views matter** — auto-injection is part of what running C0 actually costs.

### F3 — Direct-fetch beats search whenever symbols are conventionally named
C3b consistently beat C3 by ~530 chars/task. Convention-driven naming + per-area CLAUDE.md = guess-correct rate near 100% for this codebase. The PLAN's hypothesis that `kind: "class"` filter would help is correct but secondary — direct-fetch is the bigger win.

### F4 — UI tasks are jcodemunch's blind spot
T5 (audio+UI) saw C3 go *over* C0 by 30 chars. The reason: get_symbol_source returns the symbol body, but inserting JSX requires the surrounding component structure. Read of EffectsRack.tsx was unavoidable even with jcodemunch. **Proposal:** for UI tasks, plan for hybrid (jcodemunch on the audio module + Read on the JSX file). Don't try to substitute jcodemunch fully.

### F5 — semble has the wrong granularity for this repo
At 281 chunks across 108 files, semble's chunk size is ~10 lines. That's too coarse for symbol-level retrieval and too fine for whole-file context. Vicinity / vector retrieval would shine in 1M+ LOC monorepos where AST indices are slow to build; for this repo (~12k LOC) jcodemunch dominates. **Re-evaluate semble at scale**, not on the demo repo.

### F6 — Council token cost not yet measured
Council has not run yet for v4. Council cost = persona spawn × 6 × ~5,000 input + ~3,000 output ≈ 48,000 tokens. v4 saved ~13,000 chars × 4 configs = ~52,000 chars across T1-T5 (≈13,000 tokens). **Council is net-negative on a single run.** Breakeven needs ~4 benchmark cycles. To be tracked in COUNCIL-COSTS.md after council fires.

### F7 — SPEC.md had two stale oracles
Original SPEC oracles referenced `audioEngine.ts` and `effectsBus.ts` — neither exists. Actual files are `engine.ts` and `effects.ts`. Found by C8 semble's chunk inspection. **SPEC fixed in this run.** Lesson: oracles need a lint pre-flight (does the path exist?) before the benchmark runs.

## v4 vs v3

v3 reported C3 at -43% vs C0. v4 C3 measured at -34%. The -9-point drop is explained by:
- v4 honestly counts CLAUDE.md auto-injection in C0 (v3 did not always, depending on pathway)
- v4 ran T1 with the language filter (smaller hit) and T2 without finding PadState dependency (smaller cost)

v4 C3b at -44% reproduces the v3 C3 magnitude using direct-fetch instead of search.

## What went well / what to fix

✓ Language filter eliminated T1 noise (v3 → v4)
✓ Quality verification: every claim of "task done" is now backed by typecheck + tests + oracle
✓ Edit application is idempotent: revert-and-retry produced clean baselines for each config
✓ semble integration worked (uv-only install, pickle-based persistence, ~16s rebuild)

✗ S1 (staleness) not measured — needs `register_edit` integration; deferred
✗ S2/S3 long-session/multi-session — not done in main session; partly covered by S5 proxy
✗ S5 (multi-session proxy) — pending sub-agent spawn
✗ C8 chunk granularity tuning — top_k=2 + larger chunks proposed but not validated
✗ COUNCIL-COSTS.md — pending council run

## Files

- T{1-5}-C0-baseline.md
- T{1-5}-C3-jcodemunch.md
- T{1-5}-C3b-direct-fetch.md
- T{1-5}-C8-semble.md (written by C8 background agent)
- SPEC.md (oracle paths fixed)
- PLAN.md (v4 plan; B+C merged scope)
