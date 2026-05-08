# Benchmark v4 — Council Aggregation

Run: 2026-05-08
6 personas spawned in parallel (P1 Cherney, P2 Karpathy, P3 Junior, P4 Senior, P5 Security, P6 ML-infra).
Per-persona reviews live at `.claude/reports/benchmark-v4/COUNCIL-P{1-6}-*.md`.

## Consensus calls (≥4 personas agreed)

### C1 — F1 staleness needs a hook (P1, P2, P4 explicit; P3 implicit)

`_freshness: stale_index` is a free signal nobody enforces. **S4 confirmed**:
`content_verified: true` is silently misleading after edits — hash matches indexed
snapshot, not live file. An agent trusting that field will use stale code.

**Action:**
- PostToolUse hook on Edit|Write to record the path
- Debounced async re-index after 5s idle
- Pre-commit hook calls `index_folder { incremental: true }`
- get_symbol_source wrapper that compares mtime → forces re-index if file is newer

### C2 — C3b becomes the default (P2, P3, P4, P6)

Convention-driven naming + per-area CLAUDE.md = guess-correct rate near 100%.
search_symbols becomes pure overhead when the prior already locates the symbol.

**Action:**
- Update CLAUDE.md "Tool priority" — C3b first, fall back to search if symbol_id miss
- Document the guess heuristic: file path inferable from CLAUDE.md or wiki

### C3 — F2 dual-reporting (P1, P2)

CLAUDE.md auto-injection adds 3,000-5,000 chars per C0 task. C0's "loss" is partly
this hidden tax, not a tool-quality fact. RESULTS.md must show both views.

**Action:**
- RESULTS.md: split chars_total into `tool_returned` and `auto_injected`
- C3/C3b's win without auto-injection counted is ~25% lower than reported

### C4 — semble defer until >250k LOC (P2, P6)

At 12k LOC: chunks are too coarse for symbols, too fine for files. 0/5 perfect
chunk-line recall. P6 reframes the threshold: language-heterogeneity matters more
than LOC; band ~250k LOC OR >3 languages.

**Action:**
- Park C8 work on this repo
- Hybrid (embed doc-comments + AST-index symbols) is the next experiment, scoped
  to a larger heterogeneous repo

### C5 — Council ROI threshold (P1, P2)

This council cycle: ~235k tokens spent. v4 saved ~13k tokens × 4 cycles to break
even. Single-run net-negative.

**Action:**
- Add council-skip threshold to `/benchmark-council` skill: skip council if
  expected savings × payback_runs < cycle cost
- Council only justified when findings drive architecture changes (F2, F5 did)

## Single-persona but high-impact findings

### P5 — Pickle RCE risk (security-critical)

`graphify-out/semble-index.pkl` is gitignored but the *technique* of pickle
persistence is fragile. `pickle.load` is RCE-capable on untrusted input. If a
teammate ever shares an index across machines (e.g. via S3 cache), it's a
compromise vector.

**Action:**
- Document: semble pickles are LOCAL ONLY. Never share across machines.
- Migrate to a safer serialisation (JSON + numpy npz for embeddings) before any
  shared-cache feature is added.

### P5 — Unpinned uvx invocations

`uvx jcodemunch-mcp`, `uvx graphify-py`, `uv tool install semble` all unpinned.
Cold start pulls latest PyPI; supply-chain compromise → immediate MCP RCE.

**Action:**
- Pin versions: `uvx jcodemunch-mcp@0.x.y`, etc.
- Add a hash-pinning step to `/benchmark-setup`

### P4 — Index ownership broken at team scale

`~/.code-index/` is per-user. Two devs working on the same repo each pay their
own indexing cost. No CI-rebuild contract.

**Action:**
- Decide: per-user only (current) vs CI-built shared artifact
- If shared: CI runs `index_folder` on push to main; artifact at `s3://<bucket>/code-index/<sha>.db`
- If per-user: SessionStart hook reminds devs to re-index if mtime > 1d old

### P3 — DX confusion: collapse the choice

Junior dev shouldn't have to know about C0 vs C3 vs C3b. The agent should auto-pick.

**Action:**
- CLAUDE.md "Navigation" section becomes a flowchart, not a tier list
- Default agent behaviour: try direct fetch; on miss, fall back to search; on miss again, fall back to Read

### P6 — Null result on quality is the v4 headline

All 4 configs produced identical edits for all 5 tasks. Exploration cost ≠ implementation
quality. Once oracle_pass=yes, further retrieval R&D is *pure* token economics.

**Action:**
- Frame v5+ benchmarks as token-cost-only studies once quality plateau is confirmed
- Add a "quality-plateau test": if N configs hit oracle_pass=yes on M tasks, declare
  the quality variable controlled and freeze it

## Top 5 changes by (votes × ROI / effort)

| # | Change | Votes | Est ROI | Effort | Score |
|---|--------|------:|--------:|-------:|------:|
| 1 | F1 staleness hook (PostToolUse + pre-commit re-index) | 4 | high | low | ★★★★★ |
| 2 | C3b default + smarter fallback in CLAUDE.md | 4 | med | low | ★★★★ |
| 3 | RESULTS.md dual-reporting (with/without auto-injection) | 2 | med | low | ★★★★ |
| 4 | Council-skip threshold in `/benchmark-council` | 2 | high (saves ~235k/cycle) | low | ★★★★ |
| 5 | Pin uvx versions in `/benchmark-setup` | 1 | high (security) | low | ★★★★ |

## What v4 declared OUT-OF-SCOPE (deferred)

- **S1**: index staleness degradation curve over 10 commits — needs separate run
- **S2**: long-session amortisation — needs in-session, not measured
- **S3**: real multi-session cold start — requires actual session restarts, not sub-agents
- **S5**: 3-session multi-session loop — sub-agent proxy is too weak (no MCP inheritance, no real SessionStart). Marked as handoff doc.
- **C8 tuning**: top_k=2, larger chunks, symbol-aligned chunking — moved to >250k LOC repo

## Stopping condition for v4

✓ ≥30% threshold met by C3 (-34%) and C3b (-44%)
✓ All S-scenarios identified, S4 measured, S1/S2/S3/S5 documented as deferred
✓ 6-persona council reviewed, top changes ranked
✓ 3 council cycles complete (v2, v3, v4)

**v4 is closed.** Next session: implement Top-5 changes, then re-run a focused
v5 to validate the fixes.
