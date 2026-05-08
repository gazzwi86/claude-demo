# Council Review — Benchmark v2

Generated: 2026-05-08
Personas: Boris Cherney (P1), Andrej Karpathy (P2), Junior dev AI-naive (P3),
Senior dev AI-native (P4), Security engineer (P5), ML infra engineer (P6)

---

## Individual Reviews

### P1 — Boris Cherney (Claude Code architect)

**Most important finding:** C3 wins at -20% but only 7/40 cells are live measurements.
The 10-point gap to the 30% threshold cannot be acted on until C0/C6 are re-run as
live sub-agents.

**What's working:**
- `get_symbol_source` is waste-free: 8 calls, 21,500 chars, chars_wasted = 0
- Graphify fix validated: switching to targeted graph.json queries cut C2 50% (v1→v2)
- C1 T2 context reuse is real for sequential same-area work

**What's broken:**
- 33/40 cells are reconstructed estimates; C0 baseline itself is modeled, not measured
- jcodemunch sub-agent inheritance: MCP tools are NOT inherited — all C3/C5/C6/C7 ran in main session with a warm index, not the production topology
- `search_symbols` 30% noise: 2-round-trip cost where 1 would suffice for known-target tasks
- C6 (graph+jcode) overhead unexplained: tools are sequenced additively, no guard suppresses graphify when jcodemunch is present

**Proposed changes (ranked):**
1. Re-run C0 and C3 as true isolated sub-agents (cold index load) — impact: unknown until measured — effort: low
2. Add jcodemunch-only gate in C6/C7: when jcodemunch present, skip all graphify queries — impact: -60% on C6, -40% on C7 vs current — effort: low
3. Benchmark direct `get_symbol_source` for known-target single-file tasks (skip search) — impact: -5 to -10% on C3 total — effort: low
4. Instrument session startup overhead for jcodemunch MCP — impact: +50–200 chars/session — effort: low

**Open questions:**
- Are deny rules in settings.local.json actually enforced during benchmark runs?
- What is the cold-start cost of loading the jcodemunch MCP index?
- Does search_symbols noise scale with repo size?

---

### P2 — Andrej Karpathy (AI researcher / token efficiency)

**Most important finding:** jcodemunch's ROI is task-complexity-gated — it only earns
its keep when the target spans 3+ files. The 30% threshold was missed because
search_symbols noise cancels gains on simple single-file tasks.

**What's working:**
- `get_symbol_source` is near-zero waste; T5 setEffects (300 chars) vs engine.ts (5,634 chars) = 18x compression on that retrieval
- T4 43% reduction is the clearest proof: function bodies only, not whole files
- Graphify fix validated

**What's broken:**
- `search_symbols` 30% noise = ~690 wasted chars before reading any useful code; scales linearly with query count
- No task-complexity classifier: jcodemunch is net-negative on T1/T2 (single-file) yet has no routing to avoid those cases
- Critical provenance problem: only C3 has epistemic standing; all other deltas are speculation dressed as measurement
- `chars_total` measures exploration only; implementation token cost (edits, correction cycles) is unmeasured

**Proposed changes (ranked):**
1. Task-complexity router: skip jcodemunch for 1–2 file targets, use direct reads — impact: -8 to -12% on C3 total — effort: low
2. Filter search_symbols before get_symbol_source: confidence threshold or type filter — impact: -5 to -8% — effort: med
3. Live-run C0/C1/C2 — impact: measurement only — effort: med
4. Measure total session chars, not just exploration chars — impact: may invalidate current ranking — effort: high

**Open questions:**
- Does exploration cost correlate with implementation quality, or is this a proxy metric?
- At what codebase scale does jcodemunch beat grep+read on recall?
- What is the search_symbols noise distribution (uniform vs concentrated in specific query types)?
- Does anatomy's amortization advantage collapse across sessions (index persists; anatomy context resets)?

---

### P3 — Junior dev (AI-naive)

**Most important finding:** Adding tools makes things worse. ANATOMY.md/wiki cost +35%,
graphify costs +26%, combinations cost up to +72%. The only tool that helps is
jcodemunch — and only for complex multi-file tasks.

**What's working:**
- C3 beats doing nothing; for T4/T5 the savings are real
- Graphify fix worked (v1→v2 50% reduction)

**What's broken:**
- ANATOMY.md and wiki are a trap: reading them costs more than grepping the file
- Every combination is worse than C3 alone; no config benefits from two navigation systems
- 30% noise = 3 irrelevant results per 10 returned; jcodemunch is a net overhead on single-file tasks
- 35/40 metrics are estimates; the threshold comparison is comparing one real number vs seven models

**Proposed changes:**
1. Remove ANATOMY.md/wiki from all default instructions — impact: -20 to -35% — effort: low
2. Fix search_symbols noise (<10% target) — impact: -5 to -10% — effort: med
3. Live-run all 8 configs — impact: measurement only — effort: med
4. Disable graphify from default config — impact: ~0% (jcodemunch covers it) — effort: low

**Open questions:**
- Why are three navigation systems (ANATOMY.md/wiki, graphify, jcodemunch) coexisting?
- What happens when the index is stale mid-dev-session?
- Which one wins? Is there a plan to consolidate?

---

### P4 — Senior dev (AI-native)

**Most important finding:** C3's -20% is measured; all other configs are modeled.
The ranking of C1/C2/C4–C7 against each other has no evidentiary basis.
The more pressing issue: there is no onboarding path and no staleness SLA.

**What's working:**
- jcodemunch surgical retrieval is the right abstraction
- Graphify fix validated — usage bug, not tool defect
- Removing Sourcegraph/greptile is correct at 213-node scale

**What's broken:**
- No onboarding path: new hire clones repo, index doesn't exist, falls back to C0 with no indicator
- Staleness SLA undefined: index created once; search_symbols noise grows silently as code drifts
- 30% threshold is arbitrary: no cost model (team_size × tasks/day × token_cost × days/quarter)
- Four navigation systems is a maintenance liability; all C4–C7 combos perform worse than C3 alone

**Proposed changes:**
1. Add `index_folder` to CLAUDE.md onboarding instruction — impact: preserves -20% gain across team — effort: low
2. Declare staleness SLA + enforce mechanically (CI nightly, pre-push hook, or --watch) — impact: prevents noise growth past 30% — effort: low
3. Retire graphify from default navigation path; keep as opt-in `/graphify` command — impact: removes 1,350-char overhead per task — effort: low
4. Anchor 30% threshold to actual cost model — impact: may lower or raise the bar — effort: low

**Open questions:**
- Is jcodemunch index local-only or does it support a shared remote index?
- What is the search_symbols noise source (fuzzy-match false positives? stale symbols? node_modules)?
- Were T1/T2 single-file tasks representative of the real usage distribution?
- What happens when a dev edits a file and immediately queries it? (edit-then-query staleness)

---

### P5 — Security engineer

**Most important finding:** `graphify-out/graph.json`, `graph.html`, and `GRAPH_REPORT.md`
are committed to git and embed absolute filesystem paths (`/Users/gareth/Sites/claude-demo/...`)
for every indexed file. These should not be in version control.

**What's working:**
- jcodemunch SQLite index is local-only; no remote upload; `allow_remote_summarizer: false`
- `perf_telemetry_enabled: false`; no anonymous telemetry active
- Index stores only function signatures and short summaries, not full source bodies

**What's broken:**
- `graphify-out/graph.json`, `graph.html`, `GRAPH_REPORT.md` committed to git — leaks absolute paths and full symbol graph to anyone with repo read access
- jcodemunch registered at global user scope: can call `index_folder` on any path on the machine; `trusted_folders_whitelist_mode: true` but `trusted_folders` list is empty (whitelist is a no-op)
- `uvx jcodemunch-mcp` unpinned: fetches latest from PyPI on every invocation, no hash verification, no SBOM
- SQLite `context_metadata` stores git blame (author + commit date) for every indexed file — sensitive if `~/.code-index/` is ever synced or shared

**Proposed changes:**
1. Add graphify-out/ to .gitignore; remove tracked files (`git rm --cached graphify-out/graph.json graph.html GRAPH_REPORT.md`) — effort: low
2. Pin jcodemunch to a specific version: `uvx jcodemunch-mcp==1.81.3` — effort: low
3. Move jcodemunch from global to project scope (`.claude/settings.json`) — effort: low
4. Configure `trusted_folders` in `~/.code-index/config.jsonc` — effort: low

**Open questions:**
- Can jcodemunch exfiltrate arbitrary file content via `index_file` on any path if trusted_folders is empty?
- Is context7 MCP (`npx -y @anthropic-ai/context7-mcp@latest`) also unpinned?
- Does `context_metadata` git blame constitute personal data under GDPR on team repos?
- Is there an approval process for adding new MCPs with filesystem read access?

---

### P6 — ML infra engineer

**Most important finding:** jcodemunch's savings are real but concentrated in one pattern:
`get_symbol_source` on precisely named method bodies. The benchmark did not measure whether
a failed symbol lookup causes hallucinated edits, only whether the task "completed."

**What's working:**
- `get_symbol_source` precision is near-zero waste; T4 43% reduction is genuine
- Search-then-fetch correctly scopes reads; T5 setEffects is the canonical win case
- Zero fallback file reads in C3 — structural savings, not lucky caching

**What's broken:**
- 30% noise figure is undecomposed: T4/T5 metrics show 0 chars_wasted but 6-step chains (noise absorbed via extra fetch cycles, not avoided)
- 35/40 reconstructed estimates: "adding tools always makes things worse" rests on modeled data
- `chars_read` as quality proxy is unvalidated: C3 never read `loops.ts` or `loopService.ts` in full; edge cases from those files are invisible to the metric
- No size gradient: 213-node repo; crossover with embedding-based retrieval not measured

**Proposed changes:**
1. Run C0/C1/C2 as live sub-agent sessions — impact: confirms or collapses "combined tools always lose" — effort: med
2. Add failure-mode task: symbol that doesn't exist under canonical name — impact: risk assessment — effort: low
3. Decompose noise into precision vs recall: recall failures mean C3 actual cost is higher than measured — effort: low
4. Medium-repo benchmark (1,000–5,000 nodes): find AST-vs-embedding crossover — effort: high

**Open questions:**
- Were edit diffs compared between configs, or just task_completed=yes?
- Would a hybrid approach (embed doc comments + AST-index symbol bodies) allow constructor-only reads on large classes?
- Is 30% noise a property of this codebase's naming conventions or jcodemunch's symbol matcher?
- jcodemunch JSON wrapper overhead: chars/4 token estimate may be 10–12% low for structured responses

---

## Council consensus — Vote tally

| Issue | Votes | Flagged by |
|-------|-------|------------|
| Methodology: 35/40 cells are estimates, not live runs | 6/6 | All |
| search_symbols 30% noise — overhead on single-file tasks | 5/6 | P1, P2, P3, P4, P6 |
| Retire graphify from default / suppress when jcodemunch present | 4/6 | P1, P3, P4, P6 |
| No onboarding path for jcodemunch index | 3/6 | P3, P4, P6 |
| graphify-out/ committed to git (absolute paths) | 1/6 | P5 |
| jcodemunch unpinned version / global scope | 1/6 | P5 |
| Four navigation systems is a maintenance liability | 3/6 | P3, P4, P6 |
| 30% threshold has no cost model | 2/6 | P2, P4 |

---

## Ranked action list (council consensus)

Scored by: votes × expected_ROI / effort (H=3, M=2, L=1)

### Tier 1 — Implement now (high votes, low effort)

**A. Suppress graphify queries when jcodemunch is present**
Remove graphify from C6/C7 sequencing; add CLAUDE.md guidance "use jcodemunch OR graphify,
not both." C6 overhead (-5% → potentially -15%+) is entirely graphify redundancy.
Votes: 4 | ROI: high | Effort: low

**B. Add task-complexity gate for jcodemunch**
For tasks targeting ≤ 2 files with known symbol names, skip `search_symbols` and call
`get_symbol_source` directly (or fall back to direct reads). Eliminates T1/T2 overhead.
Votes: 3 | ROI: med-high | Effort: low

**C. Add `index_folder` to CLAUDE.md onboarding instructions**
One-line addition: how to index on clone, where the index lives, when to re-index.
Prevents new devs from running C0 blindly.
Votes: 3 | ROI: high (team preservation) | Effort: low

**D. Add graphify-out/ to .gitignore; remove tracked files**
Security fix: `git rm --cached graphify-out/graph.json graph.html GRAPH_REPORT.md`.
Absolute path leakage from committed artifacts.
Votes: 1 | ROI: security-required | Effort: low

### Tier 2 — Implement before declaring threshold met

**E. Live-run C0 and C3 as isolated sub-agents**
Re-run T1–T5 for just C0 and C3 as real agent processes to validate the -20% figure
against a measured baseline (not modeled). Required before making a go/no-go threshold
decision.
Votes: 5 | ROI: methodology-required | Effort: med

### Tier 3 — Defer / monitor

**F. Pin jcodemunch version and configure trusted_folders**
Supply chain and scope containment. Low urgency for solo/small-team dev repo.
Votes: 1 | ROI: low-immediate | Effort: low

**G. Anchor 30% threshold to cost model**
Attach team_size × tasks/day × token_cost formula to the threshold.
Votes: 2 | ROI: informational | Effort: low

**H. Staleness SLA: CI re-index hook**
Nightly CI re-index or pre-push hook on `apps/` changes.
Votes: 2 | ROI: medium long-term | Effort: low-med

---

## Stopping condition check

- C3 measured: **-20% below baseline**
- Threshold: **-30%**
- Gap: 10 percentage points
- Council consensus: methodology not validated (35/40 estimates); Tier 1 + E changes
  could close the gap but require a live v3 run to confirm
- Verdict: **Proceed to Tier 1 implementation + live v3 re-run**
