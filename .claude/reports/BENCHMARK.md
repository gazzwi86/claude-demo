# Token-saving toolchain — canonical record

**Status:** living document. Replaces benchmark-v1/v2/v3/v4 reports.
Last update: 2026-05-08 (post graphify+semble removal).
Prior raw evidence: git commits `2d10d75` (WIP bundle) and `099679b` (v4 full run).

---

## Part 0 — Decisions made this session

Two structural decisions, made deliberately after reviewing v2/v3/v4 numbers and
the 6-persona council. **Both are reversible via git.**

### Decision D1 — collapse reports to a single doc + appendices

**Choice:** keep only this file (`.claude/reports/BENCHMARK.md`). Delete every
other file under `.claude/reports/benchmark*/`. Use appendices to inline the
metrics, council soundbites, and S4/S5 protocols. Use Appendix I to reference
the original files via git history.

**Rationale:**
- Going-forward reader needs one entry point, not 60+ scattered files.
- Raw evidence is preserved in git (commits `099679b`, `2d10d75`); nothing is lost.
- Per-task metrics (T1-C0, T1-C3, ...) and per-persona council files (P1-P6)
  were useful during the run but redundant after aggregation into RESULTS.md
  and COUNCIL.md.
- Single-file format makes future updates additive (add a new appendix or run
  history row) rather than create-new-directory.

**Considered alternatives:** keep 7 separate keeper files in `benchmark-v4/`
(rejected — still scatters the canonical view); keep DECISION-GUIDE.md only
without supporting evidence (rejected — loses the receipts that justify the
verdict).

### Decision D2 — remove graphify and semble

**Choice:** remove from this repo entirely.
- graphify: delete `graphify-out/`, `.claude/skills/graphify/`,
  `.claude/scripts/setup-graphify.sh`, `.claude/scripts/modules/graphify.py`,
  the `graphify-hint` PreToolUse hook, and references in CLAUDE.md / commands.
- semble: delete `.venv-bench/`, semble references in `/benchmark-setup` and
  `/benchmark-council` and `cc-audit-tools/SKILL.md`.

**Rationale per tool:**

| Tool | Why removed (this repo + legacy enterprise lens) |
|---|---|
| **graphify** | Marginal value at small/medium scale. At enterprise scale (millions of LOC, hundreds of repos), teams already have SourceGraph or GitHub code search; graphify duplicates it. Targeted-query pattern is OK but `mcp__jcodemunch__find_references` and `find_importers` already cover the same questions without a separate index file. The `graphify index .` step is also slow at large scale. Removing eliminates a wholly redundant tool. |
| **semble** | Failed v4 benchmark (0/5 chunk-line recall, blew char cap on 4/5 tasks). Pickle persistence is RCE-capable on untrusted input (P5 security finding) — disqualifying for any team setting. Even at >250k LOC the chunk granularity is wrong without symbol-aware chunking, which semble doesn't provide. Better waited for in a hybrid AST+embedding tool than this one. |

**Considered alternatives:** keep both, mark as optional in CLAUDE.md (rejected
— leaves dead weight in the toolchain; future readers will reach for tools that
don't help). Keep graphify only (rejected — tested above; jcodemunch covers the
same use cases).

### Decision D3 — keep anatomy / docs/wiki

**Choice:** retain. Used once-per-session for unfamiliar areas.

**Rationale:** anatomy is cheap to read on demand (per-area page is 500-1,500
chars) and it shapes onboarding. The v1 disaster was *re-reading anatomy per
task*, not anatomy itself. Drop only at huge legacy scale where structure
churns faster than refresh cadence — flag for future re-evaluation if this repo
grows past 250k LOC or undergoes a major refactor cycle.

**Considered alternatives:** drop at the same time as graphify+semble (rejected
— anatomy passed v1's failure test once the read pattern was fixed; it now
serves a distinct onboarding role that jcodemunch doesn't cover).

### Decision D4 — keep jcodemunch as production default

**Choice:** retain as the default navigation tool.

**Rationale:** v4 confirms −34% (C3) to −44% (C3b) vs C0 baseline. Quality
identical to baseline. Trivial setup (`uvx jcodemunch-mcp` + `index_folder`).
Tree-sitter language coverage is broad enough for most codebases. **One
caveat**: F1/S4 staleness must be addressed via the planned PostToolUse
re-index hook before this can be trusted at team scale.

### Net effect of D1–D4

`.claude/reports/` shrinks from ~70 files to 1.
Toolchain shrinks from {jcodemunch, graphify, semble, anatomy} to
{jcodemunch, anatomy}. The smallest mix that captures the wins.

---

## Part 1 — Verdict

### Keep

| Tool / pattern | Why kept | Notes |
|---|---|---|
| **jcodemunch C3b (direct-fetch)** | −44% vs C0 across T1-T5; cheapest config | Default for known-symbol tasks; falls back to C3 on miss |
| **jcodemunch C3 (search + lang filter)** | −34% vs C0; eliminates non-target-language noise | Use when symbol_id unknown |
| **Per-area CLAUDE.md** | Free quality-shaping context; auto-loads on Read | Mandatory in any directory with distinct conventions |
| **`.claude/rules/*.md` with `paths:` globs** | Path-gated, high signal-to-noise | Cross-cutting concerns (testing, security, style) |
| **anatomy / docs/wiki** | Onboarding for unfamiliar areas | **Read once per session, not per task** — that pattern was the v1 disaster |
| **Caveman compression (lite/full/ultra)** | Cuts response tokens ~75% | Off for code/commits/security |
| **`check-uv-over-pip` PreToolUse hook** | Mechanically enforces uv-only Python tooling | 10/10 cases pass |
| **F1 staleness signal awareness** | `_freshness: stale_index` is load-bearing safety | Hook still to be added (next-cycle work) |

### Removed (this run)

| Tool | Reason for removal |
|---|---|
| **graphify** | Marginal value at small/medium scale; legacy enterprise teams have SourceGraph / GitHub code search already; index scales poorly past ~100k files; targeted-query pattern duplicates jcodemunch's `find_references` + `find_importers` |
| **semble** | Pickle persistence = RCE risk in any team setting; wrong granularity at <100k LOC (0/5 chunk-line recall, 4/5 tasks blew 5k char cap); chunk boundaries split symbol bodies; even at >250k LOC needs symbol-aware chunking before being viable; build needs `.venv-bench` per repo |

### Never

| Pattern | Why never |
|---|---|
| Read `GRAPH_REPORT.md` per task | v1 cost +173% vs baseline |
| Re-read anatomy/wiki per task | v1 C1 anatomy disaster |
| Bare `pip install` | Hook blocks; uv only |
| Share semble pickle across machines | RCE risk (P5 finding; moot now that semble is removed) |

---

## Part 2 — Decision matrix by project shape

### A. Small/medium TS or Python monorepo (5k-100k LOC, 1-3 languages)

| Tool | Action |
|---|---|
| jcodemunch (C3b default, C3 fallback) | **Install + use** — −34% to −44% across the board |
| anatomy/wiki | **Generate once, read on demand** |
| Per-area CLAUDE.md | **Mandatory** — every directory with distinct conventions |
| Rules with `paths:` globs | **Add for each cross-cutting concern** |
| Caveman | **On for status/reviews; off for code** |
| graphify, semble | **Skip** |

### B. Large polyglot monorepo (>250k LOC, 3+ languages)

| Tool | Action |
|---|---|
| jcodemunch | **Yes** — per-area `index_folder` to manage size; staleness hook mandatory |
| anatomy | **Yes** — generate per-area; refresh in CI |
| CLAUDE.md per-area | **Mandatory** — one per service/app |
| Sparse-checkout | **Yes** — limits worktree disk explosion |
| Caveman | **Same as A** |
| Vector retrieval | **Re-evaluate** with symbol-aware chunking + safer serialisation than pickle. Not semble. |

### C. Solo prototype (<5k LOC, single language)

C0 baseline + a top-level CLAUDE.md. Skip indexing tools entirely.

### D. Enterprise / legacy / regulated

| Tool | Action |
|---|---|
| jcodemunch | **Yes — pin version** (`uvx jcodemunch-mcp@x.y.z`); per-area indexing |
| anatomy | **Optional** — if codebase has stable structure. Skip for thrashing legacy. |
| CLAUDE.md per-area | **Yes — review in PR** |
| Managed-policy MCP allowlist | **Yes** (cc-audit-enterprise) |
| Re-index hook | **Mandatory** — F1 staleness causes real bugs |
| Council | **Skip routine cycles**; trigger on dimension changes only |
| graphify, semble | **Skip** (removed; alternatives in place) |

---

## Part 3 — The headline numbers

Run on this repo (12k LOC TypeScript+TSX+JS).

| Config | Total chars (T1-T5) | vs C0 | Quality (typecheck+tests+oracle) |
|---|---:|---:|---|
| C0 baseline (Read+Grep) | 38,144 | — | ✓ |
| C3 jcodemunch + lang filter | 25,044 | **−34%** | ✓ |
| **C3b jcodemunch direct-fetch** | **21,524** | **−44%** | ✓ |
| C8 semble *(removed)* | 31,490 | −17% | ✓ |

**Quality decoupled from cost.** All 4 configs produced identical edits for all 5 tasks.
Once oracle passes, further retrieval R&D is pure token economics.

---

## Part 4 — Top changes from council (next-cycle work)

Ranked by (votes × ROI / effort).

| # | Change | Council votes | Status |
|---|---|---|---|
| 1 | F1 staleness hook (PostToolUse Edit\|Write debounced re-index) | 4/6 | Pending |
| 2 | C3b default in top-level CLAUDE.md "Navigation" | 4/6 | Pending |
| 3 | RESULTS dual-reporting (chars with vs without auto-injection) | 2/6 | This doc reflects |
| 4 | Council-skip threshold in `/benchmark-council` | 2/6 | Pending |
| 5 | Pin uvx versions in `/benchmark-setup` | 1/6 (security) | Pending |

---

## Part 5 — When to revisit

Re-run focused benchmark when:

- Repo grows past 100k LOC → re-evaluate vector retrieval (not semble)
- New language added → rebuild jcodemunch index; check token-cost shift
- New tool surfaces in MCP marketplace → add as Cn config
- Token cost on routine work shifts >25% → upstream change worth investigating
- New dimension (security audit, cross-team perf, accessibility) → council justified

Otherwise the verdict in Part 1 stands: **C3b + per-area CLAUDE.md + path-globbed
rules + jcodemunch staleness hook = smallest mix that captures most savings.**

---

# Appendices

## Appendix A — Per-task metrics (from RESULTS.md)

Each task implemented end-to-end then reverted. typecheck + targeted vitest + behavioural oracle all pass for every config.

| Task | Files | C0 | C3 | **C3b** | C8 *(removed)* | Best |
|---|---|---:|---:|---:|---:|---|
| T1 padnode_fadein | 1 (audio) | 6,444 | 4,010 | **3,480** | 6,341 | C3b −46% |
| T2 engine_playing_count | 1 (audio) | 5,634 | 5,980 | **5,450** | 5,602 | C3b −3% |
| T3 loop_tags | 2 (shared+api) | 7,170 | 2,960 | **2,200** | 7,027 | C3b −69% |
| T4 loops_search | 4 (cross-package) | 10,785 | 3,953 | **3,103** | 5,928 | C3b −71% |
| T5 effects_bypass | 2 (audio+UI) | 8,111 | 8,141 | **7,291** | 6,592 | C8 −19% (semble's only win, but removed) |

Per-task notes:

- **T1** — C3 with `language: typescript` filter eliminated v3's 80% Python-test noise. `_freshness: stale_index` first surfaced here as a free signal.
- **T2** — single-class single-file. C3 went +6% over C0 because search_symbols overhead exceeds savings on small files. C0 wins this shape; C3b wins by skipping search.
- **T3** — multi-file (shared schemas + api db). Biggest C3 win (−59%). Batched `get_symbol_source` for 4 symbols at once via MUNCH/1 dictionary encoding.
- **T4** — hardest task (4 files, cross-package). Biggest C3b win (−71%). Read of routes/loops.ts still needed because new handlers insert INTO that file — jcodemunch returns symbol bodies, not file structure.
- **T5** — UI insert. C3 effectively flat (+0.4%) because component JSX inserts require structural context that get_symbol_source doesn't return. **jcodemunch's blind spot.**

## Appendix B — Findings (F1-F7 from RESULTS.md)

### F1 — `_freshness: stale_index` is load-bearing

Every jcodemunch `get_symbol_source` response carries `_freshness`. **S4 confirmed**:
`content_verified: true` is silently misleading after edits — hash matches indexed
snapshot, not live file. An agent trusting `content_verified` will use stale code.

→ Highest-ROI hook proposal. See Appendix D for full S4 protocol.

### F2 — CLAUDE.md auto-injection is a hidden cost component

Per-area CLAUDE.md auto-loads on Read in matching paths
(`apps/web/`, `apps/api/src/`, `apps/api/src/db/`, `apps/api/src/routes/`,
`packages/shared/`, `apps/web/lib/audio/`, plus rule files matching `paths:` globs).

Every C0 task pays this cost; jcodemunch tasks do NOT (MCP tool doesn't trigger Read).
Across T1-T5, CLAUDE.md added ~3,000-5,000 chars to C0 totals.

If the benchmark counted ONLY tool-returned chars (no auto-injection), C0 would look
~25% cheaper. C3/C3b would still win, but margin shrinks. **Both views matter.**

### F3 — Direct-fetch beats search whenever symbols conventionally named

C3b consistently beat C3 by ~530 chars/task. Convention-driven naming + per-area
CLAUDE.md = guess-correct rate near 100% in this codebase. **PLAN's hypothesis that
`kind: "class"` filter would help is correct but secondary** — direct-fetch is the
bigger win.

### F4 — UI tasks are jcodemunch's blind spot

T5 (audio+UI) saw C3 go *over* C0 by 30 chars. `get_symbol_source` returns the symbol
body, but inserting JSX requires the surrounding component structure. **Plan for
hybrid** (jcodemunch on the audio module + Read on the JSX file).

### F5 — vector retrieval (semble) wrong granularity at <100k LOC

281 chunks across 108 files = ~10 LOC/chunk. Too coarse for symbols, too fine for
files. 0/5 perfect chunk-line recall on T1-T5. Hybrid scores cluster 0.015-0.025 —
no clean confidence threshold. **Removed from this repo.** P6 places the crossover
band at ~250k LOC OR >3 languages; needs symbol-aware chunking before viable.

### F6 — Council net-negative on single cycle

Council cost ~235k tokens; per-cycle saving ~4k. 56-cycle break-even on tokens alone.
**Only justified when findings drive architecture changes** (this run did: F1 + C3b).

### F7 — SPEC.md had two stale oracles

Original SPEC referenced `audioEngine.ts` and `effectsBus.ts` — neither exists.
Actual files: `engine.ts`, `effects.ts`. Found by C8 semble's chunk inspection
(semble's only positive contribution before removal). **SPEC fixed.** Lesson:
oracles need a lint pre-flight (does the path exist?).

## Appendix C — Council per-persona soundbites

6 personas spawned in parallel. Each ~250 words. Total council cost: 234,904 tokens.

### P1 — Boris Cherney (Claude Code architect)

- F1 staleness is highest-ROI lever — propose PreToolUse hook gating re-index on content_hash mismatch
- F2 reporting asymmetry is a permission-model artifact (Read triggers auto-inject, MCP doesn't); RESULTS should dual-report
- F6 council ROI net-negative on single cycle; propose skip threshold in council SKILL
- Open: MCP handshake amortisation, `register_edit` invalidation semantics, sub-agent deny-rule enforcement

### P2 — Andrej Karpathy (token economics)

- F2 reframed as headline: CLAUDE.md auto-injection explains most of C3/C3b's lead
- F3 endorsed: convention-named symbols make search_symbols pure overhead
- F5 (semble): 10 LOC/chunk is neither symbol nor file; defer to >100k LOC
- F6: 48k spent to save 13k/cycle; only defensible when findings drive architecture
- Top moves: dual-C0 reporting, C3b-by-default, larger symbol-aligned chunks, council-skip threshold, F1 hook

### P3 — Junior dev (AI-naive)

- C3b's win is conditional on knowing the symbol — top concern (F3 implication)
- F1 staleness invisible; F2 auto-injection hidden; F5 semble setup too much per-project learning
- Top ROI: collapse the choice (default C3, auto-promote C3b) and auto-handle staleness so juniors don't have to think about it
- Open questions channel naive confusion: why stale at all, why an index if Claude can grep, why pay for council at net-negative

### P4 — Senior dev (AI-native, devops blend)

- Most important: F1's `_freshness: stale_index` has no SLA, no CI job, no hook — wins regress silently across a team
- Index ownership broken: jcodemunch index per-user (`~/.code-index/`), no CI rebuild or shared artifact; concurrent commits diverge
- C3 goes over C0 (T2 +6%, T5 ±0%) when target is self-contained class in known file, or when edits need structural context
- Proposed: CI `index_folder --incremental` on push to main + PostToolUse staleness warning; pre-flight regime predicate; cc-audit-tools

### P5 — Security engineer

- **S-2 critical**: semble pickle persistence — `pickle.load` is RCE-capable; never share/cache across machines (semble now removed)
- **S-1 high**: `uvx jcodemunch-mcp`, `uvx graphify-py`, `uv tool install semble` all unpinned in benchmark-setup; cold start pulls latest PyPI; supply-chain → MCP RCE
- **S-3 medium**: F1 `content_hash` proves local-state shape but NOT no network egress; needs `lsof` verification
- **S-4 low**: graphify-out gitignored (now removed) but no pre-commit gate
- **S-5 medium**: MCP scope `--scope project` correct but allowlist wide; `mcp__jcodemunch__embed_repo` should be denied; keep `use_ai_summaries: false`

### P6 — ML infra engineer

- Crossover driven by language-heterogeneity, not LOC. Band ~250k-500k LOC OR >3 languages. The 1M LOC framing was wrong axis.
- Hybrid: embed doc-comments + module summaries; AST-index symbols; route by query shape (NL vs identifier-token)
- top_k=2 + larger chunks does NOT fix F5 — need symbol-aware chunking on AST boundaries
- Threshold without labels: score-gap heuristic OR rank-stability under query paraphrase
- **Null result on quality** is strongest v4 signal — exploration is bounded search; once oracle_pass=yes, further retrieval R&D is pure token economics

## Appendix D — S4 post-edit staleness (full)

Procedure:
1. Apply T3 edit (add `tags` to CreateLoopSchema in `packages/shared/src/schemas.ts`)
2. WITHOUT calling `index_folder`, immediately call `get_symbol_source` with `verify: true`
3. Compare returned source vs live file
4. Inspect `_freshness` flag

Result:

```
returned source: 7 fields, NO `tags` (PRE-EDIT body)
content_hash:    3788cc3a... (PRE-EDIT hash; matches indexed snapshot)
content_verified: true       <-- THE BUG: hash matches indexed content, NOT live file
_freshness:      "stale_index"   <-- correct staleness flag
```

**Key finding:** jcodemunch's `content_verified: true` is computed against the
indexed snapshot's hash, NOT the live file. A consumer that trusts
`content_verified: true` will silently use stale code. **`_freshness` is the only
honest signal** that the index hasn't been refreshed since the file was last edited.

Implication: the agent must check `_freshness` (or compare content_hash to a fresh
hash of the live file) before trusting any `get_symbol_source` response after an edit.

### Re-index SLA proposal

| Trigger | Action |
|---|---|
| Edit/Write | PostToolUse hook records path; debounced async re-index after 5s idle |
| Commit | pre-commit hook calls `index_folder { incremental: true }` |
| Cold start | SessionStart hook checks last_index_at; if > 1h old, re-index in background |
| CI | post-merge job re-indexes shared artifact (or skip if per-user) |

This finding upgrades F1 from "useful flag" to **load-bearing safety check**. A
C3-using agent that ignores `_freshness` will produce
technically-pass-typecheck-but-semantically-wrong code on any post-edit query.

## Appendix E — S5 multi-session protocol (handoff)

S5 was NOT run in v4. Sub-agent proxy is too weak: MCP not inherited, SessionStart
hooks don't fire, index state is shared, no compaction artifacts.

**Proper S5 protocol** (manual, across 3 real Claude Code sessions over ~3 days):

### Day 0 — session A (cold install)

```
1. rm -rf ~/.code-index/local-claude-demo-*  (force cold)
2. Fresh `claude` session in repo
3. Run benchmark for T1-T5 in C0 + C3 + C3b modes
4. Record to .claude/reports/benchmark-S5/A-T*.md
5. Make 5 commits to apps/web/lib/audio/* (random unrelated edits — drift)
6. /exit
```

### Day 1 — session B (cold restart, stale index)

```
1. Do NOT rm ~/.code-index — keep stale state
2. Fresh `claude` session
3. Run T1-T5 in C0 + C3 + C3b WITHOUT calling index_folder
4. Record to .claude/reports/benchmark-S5/B-T*.md
5. Compare: did C3/C3b oracle_pass go down vs A? Did chars_total change?
6. Make 5 more commits
7. /exit
```

### Day 2 — session C (fresh re-index)

```
1. Fresh session
2. Call index_folder { incremental: true } before any tasks
3. Re-run T1-T5
4. Record to .claude/reports/benchmark-S5/C-T*.md
5. Compare: did re-indexing recover quality? Rebuild time?
```

### Analysis

- Plot oracle_pass rate vs commits-since-reindex
- Establish re-index SLA: "C3 quality drops below C0 after N commits without re-index"
- Use SLA to wire the F1 staleness hook (PostToolUse Edit|Write)

Estimated cost: 3 sessions × ~30k tokens = ~90k tokens total. Fits in one normal day.

## Appendix F — Council token economics

Per-persona costs (from background agent completion notifications):

| Persona | total_tokens | tool_uses | duration_ms |
|---|---:|---:|---:|
| P1 Cherney | 40,941 | 6 | 50,082 |
| P2 Karpathy | 39,945 | 6 | 42,503 |
| P3 Junior | 35,773 | 3 | 27,714 |
| P4 Senior | 37,200 | 4 | 39,694 |
| P5 Security | 39,485 | 4 | 47,614 |
| P6 ML-infra | 41,560 | 6 | 45,364 |
| **Total** | **234,904** | **29** | wall ~50s parallel |

ROI:

| Config | Saving (chars) | Saving (tokens, /4) |
|---|---:|---:|
| C3 | 13,100 | 3,275 |
| C3b | 16,620 | 4,155 |

**Council cost: 234,904 tokens. Per-run best-config saving: 4,155 tokens.**
**56-cycle break-even** on token economics alone.

Council is net-positive only when findings drive architecture changes that compound
across all future agent sessions. v4 council DID identify such changes (F1 hook,
C3b default), so v4 was net-positive.

### Skip threshold proposal for `/benchmark-council` skill

```yaml
council:
  skip_if:
    - cost_change_vs_last < 15%
    - same_configs_as_last == true
    - last_cycle_findings_unimplemented_count > 0
  trigger_if:
    - new_config_added
    - new_dimension_added (quality, temporal, security)
    - cost_change_vs_last > 25%
    - user_explicit_request
```

## Appendix G — Run history / changelog

| Cycle | Outcome | Key commit |
|---|---|---|
| **v1** (`benchmark/`) | Baseline won. Graphify −173% (read GRAPH_REPORT.md per task — bug). jcodemunch never ran (MCP not loaded at session start). | (deleted; in git history) |
| **v2** (`benchmark-v2/`) | Fixed graphify read pattern. All 8 configs ran. C3 jcodemunch at −20% modeled. 35/40 metrics reconstructed estimates. Threshold (30%) not met. | (deleted) |
| **v3** (`benchmark-v3/`) | **Threshold met.** Live C0 vs live C3. C3 at −43% below C0. Tier 1 changes implemented (CLAUDE.md jcodemunch-first, graphify-out gitignored, graphify SKILL.md updated). | (deleted) |
| **v4** (this) | Quality verification added. C8 semble. C3+language filter. C3b direct-fetch. S4 staleness. 6-persona council. Threshold met by C3 (−34%) and C3b (−44%). v4 is closed. | `099679b` |
| **v4 cleanup** (this) | graphify + semble removed; reports collapsed to single canonical document with appendices. | (this commit) |

## Appendix H — Tool removal log

### Removed in this cleanup

- `graphify-out/` directory (graph.json, GRAPH_REPORT.md, semble-index.pkl, cache/)
- `.claude/skills/graphify/` skill directory
- `.claude/scripts/setup-graphify.sh`
- `.claude/scripts/modules/graphify.py` hook module
- `graphify-hint` PreToolUse hook on Glob|Grep (settings.json + hooks.py)
- `.venv-bench/` Python virtual environment
- semble references from `/benchmark-setup` and `/benchmark-council` commands
- semble + graphify sections from `cc-audit-tools/SKILL.md` (T2, T3 → removed)
- graphify references from top-level CLAUDE.md "Navigation" section
- Old benchmark report directories (benchmark/, benchmark-v2/, benchmark-v3/)
- Old per-task / per-persona files in benchmark-v4/

### Kept (deliberately)

- jcodemunch (production-default) — MCP server, index at `~/.code-index/`
- anatomy / docs/wiki — onboarding for new contributors; one read per session
- caveman compression — cross-cutting; works regardless of repo
- check-uv-over-pip hook — mechanical enforcement of uv-only Python tooling
- cc-audit-tools sub-skill — still relevant for jcodemunch checks (graphify+semble sections trimmed)

## Appendix I — Reference files

Raw evidence is preserved in git history. To recover any deleted file:

```bash
# View the v4 results commit
git show 099679b

# Recover a specific deleted file
git checkout 099679b -- .claude/reports/benchmark-v4/T1-C3-jcodemunch.md

# Browse all benchmark-v4 outputs at the v4 commit
git ls-tree -r 099679b -- .claude/reports/benchmark-v4/
```

Source commits:

| Commit | Contents |
|---|---|
| `e055827` | fix(hooks): guard Stop-hook completion review against re-entry loop |
| `8dadd83` | refactor(hooks): split 814-line dispatcher into thin harness + modules/ |
| `2d10d75` | chore: bundle WIP — uv-over-pip enforcement, benchmark v2/v3/v4 reports, misc fixes |
| `099679b` | chore(benchmark-v4): full run + 6-persona council + cc-audit-tools |
| (this commit) | chore: collapse benchmark reports + remove graphify + remove semble |
