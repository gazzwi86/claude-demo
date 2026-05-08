# Benchmark v4 — Next-Session Plan

Generated: 2026-05-08
Status: Ready to execute in next session.

## Context (read before doing anything)

This is a self-contained brief for the next agent session. Prior work:

- **v1** (`.claude/reports/benchmark/`): Baseline won. Graphify 173% worse (read GRAPH_REPORT.md
  in full per task). jcodemunch never ran. C1 anatomy partial (API error).
- **v2** (`.claude/reports/benchmark-v2/`): Fixed graphify read pattern (targeted graph.json
  queries). Ran all 8 configs; C3 jcodemunch at -20% vs modeled baseline. 35/40 metrics
  reconstructed estimates. Threshold (30%) not met.
- **v3** (`.claude/reports/benchmark-v3/`): **Threshold met.** Live C0 (sub-agent) vs live C3
  (main session). C3 at -43% below C0. Graphify fix validated. Tier 1 changes implemented.
- **Tier 1 changes implemented**: CLAUDE.md navigation priority (jcodemunch-first, onboarding
  instruction), graphify-out removed from git, graphify SKILL.md updated with targeted queries.

## What v4 adds

v4 extends the benchmark in four dimensions the council said were missing:

### Dimension 1 — Quality verification (P2, P6 council concern)

v3 measured exploration cost only. C3 and C0 both "completed" T1-T5 but the actual
edits were never compared. v4 adds a **quality verdict** to every metrics file.

**How to implement:**
- For each task, have each config agent actually write the proposed edit to a temp branch
- Run `pnpm typecheck` and `pnpm test` on each branch after the edit
- Record `quality_verdict: pass|fail` and `tests_pass: yes|no` in the metrics file
- Compare the actual diffs between C0 and C3 for each task — are they identical?
- **Behavioural oracle (B):** typecheck + existing tests prove "compiles" not "solved task". Each task in SPEC.md must declare a `behavioural_oracle` block — a deterministic assertion that the task intent was met. Examples:
  - T1 (padNode fadeIn): new test `padNode.fadeIn applies linear ramp to gain` exists and passes
  - T2 (loop CRUD endpoint): `curl -s POST /loops` returns 201 with the new field
  - T3 (schema tags): zod schema export `LoopSchema.shape.tags` is defined and `.array(z.string())`
  - T4 (multi-file change): grep proves all 4 expected files contain the change marker
  - T5 (effects rack): RTL test `EffectsRack renders <new effect>` exists and passes
- Each oracle is a 1-line bash assertion run after the edit. Verdict: `oracle_pass: yes|no`. A config that compiles + passes existing tests but fails the oracle = `quality_verdict: fail`.

New metrics schema field:
```yaml
quality:
  typecheck: pass|fail
  tests_pass: yes|no
  oracle_pass: yes|no
  oracle_assertion: "bash one-liner that ran"
  diff_vs_c0: identical|diverged|not_applicable
  divergence_note: "optional: what differed"
```

This answers P2's question: "Does exploration cost correlate with implementation quality?" — and goes one step further by validating *task completion*, not just *code correctness*.

### Dimension 2 — Semble (C8) — embedding-based retrieval

Semble is a sentence-transformer embedding library (local, no API key).
Repo: https://github.com/MinishLab/semble

C8 config: build a semble FAISS index over chunked TypeScript source, then retrieve
by semantic similarity instead of AST symbol names. Answers P6's question:
"At what scale does a vector index beat jcodemunch on recall?"

**Setup:** Run `/benchmark-setup` first. The command handles semble installation and
index building. Semble index is at `graphify-out/semble-index.pkl`.

**How C8 works:**
1. Build chunks: split each .ts/.tsx file into 200-token overlapping windows
2. Embed chunks using semble's local sentence-transformer model
3. For each task, query with the task description as the search string
4. Retrieve top-K chunks (target: ≤ 2,000 chars total)
5. Measure chars_total, noise ratio, and whether the right files were retrieved

C8 query pattern:
```python
import semble

idx = semble.Index.load("graphify-out/semble-index.pkl")
results = idx.search("fade in gain node AudioContext ramp", top_k=5)
for r in results:
    print(r.file, r.score, r.text[:200])
```

**Expected outcome hypothesis:** C8 will outperform C0 on T4 (multi-file) due to
semantic matching, but may underperform C3 because chunk boundaries split function bodies
and add noise. T1 hypothesis: C8 fixes jcodemunch's 80% Python-test noise by embedding
semantics rather than symbol names.

### Dimension 3 — T1 noise fix: language filter

v3 T1 had 80% noise in search_symbols (Python test methods returned for TypeScript search).
The fix: add `language: "typescript"` filter to search_symbols calls.

**How to verify:** Re-run T1 with C3 using explicit language filter. Expected: noise drops
to 0-10%, C3 T1 becomes cheaper than C0 T1 (not more expensive).

Update the benchmark-council SPEC.md to include language filter as part of C3/C5/C6/C7
coordinator instructions.

### Dimension 4 — Temporal and team scenarios

Four scenarios the 5-task single-session benchmark doesn't capture:

**S1: Index staleness degradation**
- Run T4 (the most jcodemunch-dependent task) with a fresh index
- Make 5 commits to unrelated parts of the codebase (without re-indexing)
- Re-run T4 with the stale index
- Measure: does search_symbols noise increase? Do char counts change?
- Target: establish the re-index SLA (e.g. "re-index after every 10 commits")

**S2: Long-session (sequential same-area tasks)**
- Run T1→T2→T3→T4→T5 in a single session for C0 and C3
- Measure whether context accumulation from earlier tasks reduces cost on later tasks
- Key question: does C1 (anatomy) amortize better in long sessions than jcodemunch?
  Anatomy context is session-scoped; jcodemunch index is persistent.

**S3: Multi-session (cold start)**
- Run T1-T5 in session A for C0 and C3
- Close the session, start a fresh session
- Run T1-T5 again
- Measure: does C3 cost more on cold restart? (jcodemunch index persists; anatomy
  context does not — C1 must re-read ANATOMY.md every session)

**S4: Post-edit accuracy (edit-then-query)**
- Implement T3 (add tags to schemas)
- WITHOUT re-indexing, immediately run T4 (search loops — which now has a new tags field)
- Measure: does jcodemunch return stale symbol bodies? Does C0 naturally get fresh content?
- Key question: does jcodemunch's staleness cause implementation errors?

**S5: Multi-session loop (3 sequential cold sessions, simulated days apart)**
- Run T1-T5 for C0 and C3 in session A. Record metrics.
- Make 5 unrelated commits to the codebase (simulate "next day" drift).
- Open fresh session B. Re-run T1-T5 for C0 and C3 *without* re-indexing. Record metrics.
- Make 5 more commits. Open fresh session C. Re-run T1-T5 for C0 and C3 *with* `index_folder incremental: true` first. Record metrics.
- Measure across A→B→C:
  - jcodemunch char-cost drift (does staleness compound?)
  - oracle_pass rate (does quality degrade as index ages?)
  - cold-start overhead per session for each tool (anatomy re-read cost vs jcodemunch warm-index reuse)
  - council_token_cost (see below) for any fix loop triggered between sessions
- Stopping condition for S5: identify the re-index SLA (e.g. "C3 quality drops below C0 after N commits without re-index") and propose a hook to enforce it.

---

## v4 Configs

| Config | Description | vs v3 |
|--------|-------------|-------|
| C0 | Baseline (direct reads) | same |
| C3 | jcodemunch + language filter | improved (T1 noise fix) |
| C3b | jcodemunch + direct fetch for known symbols | T2/T5 optimisation formalised |
| C8 | semble embedding retrieval | new |
| S1 | C3 with stale index (10 commits) | new — staleness test |
| S2 | C3 long-session (5 tasks sequential, shared context) | new — amortisation test |
| S3 | C3 multi-session cold start | new — persistence test |
| S4 | C3 post-edit without re-index | new — edit-then-query test |
| S5 | C0 + C3 across 3 cold sessions with drift | new — multi-session degradation |

---

## Pre-flight checklist

Before running v4, verify all tools are ready:

```bash
/benchmark-setup
```

Expected output: all 4 items ✓ (jcodemunch, graphify, semble installed, semble index built).

If semble is not yet available (library may be pre-release), substitute a simpler local
embedding approach. Install via `uv` only (never pip):
```bash
uv tool install sentence-transformers || uv pip install --system sentence-transformers
```
```python
# Fallback: use sentence-transformers directly
from sentence_transformers import SentenceTransformer, util
model = SentenceTransformer('all-MiniLM-L6-v2')  # ~80MB, local
```

---

## Output structure

Write results to `.claude/reports/benchmark-v4/`:
- `T{1-5}-C{0,3,3b,8}-{name}.md` — per-task metrics (same format as v3 + quality fields)
- `T{1-5}-S{1-5}-{name}.md` — temporal scenario metrics
- `RESULTS.md` — aggregate comparison table
- `COUNCIL-v2.md` — second council review focused on quality and temporal dimensions
  (re-use same 6 personas; add questions about S1-S5 findings)
- `COUNCIL-COSTS.md` — council overhead accounting (see below)

### Council token cost tracking

The council itself consumes tokens. Prior runs treated this as free; v4 measures it so net ROI is honest.

For each persona agent spawn, record:
```yaml
persona: P1|P2|P3|P4|P5|P6
input_tokens: <int>          # context fed to the agent (RESULTS.md + prompt)
output_tokens: <int>          # the persona review markdown
tool_call_tokens: <int>       # any Read/Grep calls made during review
total_tokens: <int>
```

Aggregate in `COUNCIL-COSTS.md`:
- Total council tokens per iteration cycle (v2/v3/v4)
- Council cost as % of benchmark savings (e.g. "v4 saved 4,200 tokens across T1-T5; council cost 8,800 tokens — net negative for a single run, breakeven at ~3 runs")
- Per-persona efficiency: which personas produced the most actionable findings per token spent? (cross-reference with the votes-per-persona count in the aggregation step)

Use this to set a council-skip threshold: if expected savings per council cycle < council cost / payback_runs, skip council and accept current state.

---

## cc-audit integration (update after v4)

After v4 completes, two cc-audit updates are needed:

### 1. cc-audit-settings: check jcodemunch MCP registration

Add a check in `cc-audit-settings` that warns if jcodemunch is not registered as a
project-scoped MCP. Current guidance: `claude mcp add --scope project jcodemunch uvx jcodemunch-mcp`.

Finding to emit if missing:
```json
{
  "id": "mcp-jcodemunch-missing",
  "severity": "warn",
  "area": "mcp",
  "message": "jcodemunch MCP not registered at project scope. Navigation efficiency penalty: ~+43% token overhead vs indexed baseline.",
  "fix": "claude mcp add --scope project jcodemunch uvx jcodemunch-mcp"
}
```

### 2. New sub-skill: cc-audit-tools

Create `.claude/skills/cc-audit-tools/SKILL.md` that audits tool configuration:
- jcodemunch: registered? indexed? version pinned? trusted_folders set?
- graphify: graph.json excluded from git? SKILL.md has targeted-query guidance?
- semble: available? index built and current?
- Navigation priority in CLAUDE.md: is jcodemunch-first rule present?

Wire it into the cc-audit orchestrator alongside the existing 8 sub-skills.

---

## Docs to update after v4

1. `CLAUDE.md` — add semble to navigation priority list if C8 beats C3
2. `docs/wiki/` — `/anatomy refresh` on any area touched by benchmark tasks
3. `.claude/skills/benchmark-council/SKILL.md` — update with v4 lessons:
   - Quality verification step (mandatory from v4 onwards)
   - C8 semble config definition
   - S1-S4 temporal scenario templates
4. `graphify-out/semble-index.pkl` — add to `.gitignore` (large binary)

---

## Stopping condition for v4

v4 is complete when at least one of:
- C8 (semble) outperforms C3 (jcodemunch) on the 5-task suite → document crossover
- S4 (post-edit stale) shows quality degradation → establish re-index SLA and hook
- S5 (multi-session) identifies a re-index SLA (commits-per-reindex) that holds across A→B→C → propose hook
- All S1-S5 scenarios measured + council reviewed → declare benchmark mature
- 3 council iteration cycles complete (v2, v3, v4 = 3 cycles)
- Council cost (per `COUNCIL-COSTS.md`) exceeds expected savings × payback_runs → accept current state

---

## Quick start for next session

1. Read this file
2. Run `/benchmark-setup` — verify all ✓ (uv-only installs, no pip)
3. Define `behavioural_oracle` for each task in SPEC.md (1-line bash assertion per task)
4. Run T1-T5 for C3 with language filter (verify T1 noise drops)
5. Run T1-T5 for C8 (semble) as a background agent
6. Run S4 (post-edit staleness) as main-session test
7. Run S5 (multi-session loop) — sessions A→B→C with drift between, record per-session metrics
8. Add quality (typecheck + tests + oracle + diff_vs_c0) to all metrics files
9. Write RESULTS.md with 3-way comparison (C0 / C3+filter / C8) plus S5 multi-session table
10. Spawn council v2 with quality and temporal focus — record per-persona token cost
11. Write COUNCIL-COSTS.md and check council ROI threshold
12. Update cc-audit-settings + create cc-audit-tools
13. Run `/anatomy refresh` + `/cc-audit`
