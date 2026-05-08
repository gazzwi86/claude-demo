---
name: benchmark-council
description: Iterates on the tool-comparison benchmark (jcodemunch, graphify, anatomy). Fixes graphify read pattern, runs all 8 configs, convenes a 6-persona council, implements top recommendations, and loops until tools show ≥30% ROI vs baseline.
---

# /benchmark-council

**How to run:** In a fresh Claude Code session (so jcodemunch MCP is loaded at
startup), type `/benchmark-council` — or paste the starter prompt below directly:

```
Run /benchmark-council. Context: previous benchmark at .claude/reports/benchmark/RESULTS.md
showed baseline won (9,268 tokens), graphify 173% worse (GRAPH_REPORT.md read in full every
task), anatomy partial (API error). jcodemunch configs never ran. Your job: fix graphify's
read pattern, verify jcodemunch is connected + indexed, rerun all 8 configs as isolated
worktrees, spawn a 6-persona council (Boris Cherney, Andrej Karpathy, Junior AI-naive dev,
Senior AI-native dev, Security engineer, ML infra engineer) to review results and propose
improvements, implement top consensus changes, and rerun until tools show net-positive ROI
vs baseline or 3 iterations complete. Write all results to .claude/reports/benchmark-v2/.
```

---

Iterate on the tool-comparison benchmark. Fixes graphify's read pattern, adds
jcodemunch to the run, re-runs all 8 configs over 5 tasks, then convenes a
multi-persona council to critique the results and propose config improvements.
Measures improvement vs the previous run and loops until the council agrees
nothing meaningful is left on the table.

---

## Context (read this before doing anything)

Previous benchmark run is at `.claude/reports/benchmark/`. Key findings:

- **C0 baseline**: 9,268 tokens across 5 tasks — the winner.
- **C2 graphify**: 25,261 tokens — 173% worse than baseline. Root cause: GRAPH_REPORT.md
  (13,778 chars) was read in full before every task. The graph data is accurate and useful;
  the delivery mechanism (whole-report read) is the bug.
- **C4 anatomy+graphify**: 23,962 tokens — 159% worse. Same graphify overhead plus
  ANATOMY.md re-read per task.
- **C1 anatomy**: Partial data (API error mid-T4). T2 with reused context was free.
- **C3/C5/C6/C7 (jcodemunch configs)**: Never ran — jcodemunch MCP is not available
  in sub-agents and was not loaded at the previous session's startup.
- **Theoretical C3 estimate**: ~2,025 tokens (78% under baseline) via `get_symbol_source`
  returning symbol bodies rather than whole files.

Full results + per-task breakdown: `.claude/reports/benchmark/RESULTS.md`
Spec (tasks, config definitions, metrics format): `.claude/reports/benchmark/SPEC.md`

---

## Phase 1 — Fix graphify before rerunning

The graphify fix is **not** about changing CLAUDE.md policy — it is about changing
how the graphify skill and the benchmark coordinators use the graph artifact.

### Problem

Current usage:
```
Read graphify-out/GRAPH_REPORT.md   ← 13,778 chars every time
```

GRAPH_REPORT.md is a rendered summary for humans. It is expensive to read and
does not support per-node queries. The underlying `graphify-out/graph.json`
supports jq/node queries for O(1) lookups.

### Fix A — Add targeted graph query helpers

In the coordinator prompt for any graphify config, replace "Read GRAPH_REPORT.md"
with a bash query pattern:

```bash
# Find a node by name and get its edges (≈ 200-400 chars vs 13,778)
node -e "
  const g = JSON.parse(require('fs').readFileSync('graphify-out/graph.json','utf8'));
  const node = g.nodes.find(n => n.label.includes('PadNode'));
  const edges = g.edges.filter(e => e.source===node?.id || e.target===node?.id);
  console.log(JSON.stringify({node, edges}, null, 2));
"

# Or with jq:
jq '.nodes[] | select(.label | test("PadNode"))' graphify-out/graph.json
jq --arg id "$(jq -r '.nodes[] | select(.label|test("PadNode")) | .id' graphify-out/graph.json)" \
   '.edges[] | select(.source==$id or .target==$id)' graphify-out/graph.json
```

Verify graph.json exists first:
```bash
ls graphify-out/graph.json 2>/dev/null || echo "Index missing — run: graphify index ."
```

If the index is absent, run `graphify index .` (binary at `~/.local/bin/graphify`
or via `uvx graphify-py`). This generates `graphify-out/graph.json` and
`graphify-out/GRAPH_REPORT.md`. The fix only changes which artifact you query —
both are always generated.

### Fix B — Update the graphify skill

Edit `.claude/skills/graphify/SKILL.md`:
- Replace the orientation step "Read GRAPH_REPORT.md" with the jq/node query pattern.
- Add examples of targeted queries: "find callers of X", "find imports of Y".
- Keep "Read GRAPH_REPORT.md" as a last resort for full-picture orientation only.

### Validation

Run a quick sanity check: pick T1 (padnode_fadein). Using only the node query,
find which file contains PadNode and how many edges it has. Compare chars returned
vs 13,778 (the full report size). Target: ≤ 500 chars.

---

## Phase 2 — jcodemunch setup

jcodemunch is already registered globally via `claude mcp add --scope user` (entry
in `~/.claude.json`). In a new Claude Code session, it should be available at startup.

### Verify connection (do this first, before spawning any sub-agents)

```bash
claude mcp list
# Expected: jcodemunch: uvx jcodemunch-mcp - ✓ Connected
```

If it shows disconnected:
```bash
# Re-add (idempotent):
claude mcp add --scope user jcodemunch uvx jcodemunch-mcp
# Then restart Claude Code and re-verify.
```

### Index this repo (required before any jcodemunch task runs)

In the Claude Code session, call:
```
index_folder { "path": "<repo-root>" }  # replace with absolute path to this repo
```

This builds the tree-sitter AST index at `~/.code-index/`. Takes ~30s for this repo.
Verify with:
```
get_session_stats {}
```

The index persists across sessions but becomes stale when files change. Re-run
`index_folder` after large commits or when symbol names have changed.

### Available jcodemunch tools

| Tool | Purpose | Typical output size |
|------|---------|---------------------|
| `resolve_repo` | Get repo root + index status | ~100 chars |
| `search_symbols` | Find symbols by name pattern | ~200-500 chars |
| `get_symbol_source` | Return only a symbol's body, not the whole file | ~200-800 chars |
| `get_file_outline` | All symbols in a file | ~300-600 chars |
| `find_references` | All call sites of an identifier | ~300-600 chars |
| `find_importers` | Files that import a given file | ~200-400 chars |
| `search_text` | Full-text search | varies |
| `get_session_stats` | Token savings accounting | ~100 chars |

---

## Phase 3 — Run all 8 configs

Now run the full benchmark: C0–C7 across all 5 tasks.

Write results to `.claude/reports/benchmark-v2/T{n}-C{n}-{name}.md`.

Use the same metrics format as before (read SPEC.md for the exact schema).

### Worktree setup

Create one git worktree per config and set `settings.local.json` deny rules to
enforce tool restriction. C3/C5/C6/C7 (jcodemunch configs) CAN now run in this
session since jcodemunch is loaded at startup.

```bash
# Create worktrees for all 8 configs
for config in \
  "c0-baseline" \
  "c1-anatomy" \
  "c2-graphify" \
  "c3-jcodemunch" \
  "c4-anat-graph" \
  "c5-anat-jcode" \
  "c6-graph-jcode" \
  "c7-all"; do
  git worktree add .worktrees/v2-bench-$config -b bench-v2-$config HEAD 2>/dev/null || true
done
```

Deny rules per config (write to `.worktrees/v2-bench-{config}/.claude/settings.local.json`):

| Config | Deny |
|--------|------|
| c0-baseline | ANATOMY.md, docs/wiki/*, graphify-out/*, jcodemunch tools |
| c1-anatomy | graphify-out/*, jcodemunch tools |
| c2-graphify | ANATOMY.md, docs/wiki/*, jcodemunch tools |
| c3-jcodemunch | ANATOMY.md, docs/wiki/*, graphify-out/* |
| c4-anat-graph | jcodemunch tools |
| c5-anat-jcode | graphify-out/* |
| c6-graph-jcode | ANATOMY.md, docs/wiki/* |
| c7-all | (no denies) |

Note: jcodemunch tool denies cannot be enforced via settings.local.json (MCP tool
access isn't governed by path deny rules). Enforce via strong coordinator prompt
instructions: "You are config C3. You MUST NOT read ANATOMY.md, docs/wiki/, or
graphify-out/ — use only jcodemunch tools then direct file reads."

### Coordinator prompt template

Spawn one background agent per config. Each agent:
1. Reads `.claude/reports/benchmark/SPEC.md` for task definitions
2. Reads `.claude/reports/benchmark/RESULTS.md` for context on previous results
3. Is told explicitly which tools it may and may not use (per config rules above)
4. Is told graphify-out queries must use the node/jq pattern (not GRAPH_REPORT.md)
5. Implements all 5 tasks in its worktree
6. Writes 5 metrics files to `.claude/reports/benchmark-v2/`
7. Uses `node -e` (Bash) to write files if the Write tool is permission-blocked

For jcodemunch configs: coordinator must call `resolve_repo` + `index_folder` (if
not already indexed) at the start, then use jcodemunch tools exclusively for
symbol lookup.

### Parallelism

Spawn all 8 coordinators simultaneously. They work in isolated worktrees and write
to separate output paths — no conflicts.

After all 8 complete, aggregate results into `.claude/reports/benchmark-v2/RESULTS.md`
using the same per-task and totals table format.

### Comparison table

Add a v1 vs v2 delta column to the totals table:

| Config | v1 tokens | v2 tokens | delta | % change |
|--------|-----------|-----------|-------|----------|
| C0 baseline | 9,268 | ? | ? | ? |
| C1 anatomy | (partial) | ? | ? | ? |
| C2 graphify | 25,261 | ? | ? | ? |
| C3 jcodemunch | (not run) | ? | — | — |
| C4 anat+graph | 23,962 | ? | ? | ? |
| C5 anat+jcode | (not run) | ? | — | — |
| C6 graph+jcode | (not run) | ? | — | — |
| C7 all | (not run) | ? | — | — |

---

## Phase 4 — Council review

After RESULTS.md is written, convene a council of AI personas to review the
findings and propose specific, actionable config changes.

### Persona definitions

**Spawn these 4 personas as parallel agents:**

**P1 — Boris Cherney (Claude Code architect)**
Perspective: tool integration quality, MCP reliability, sub-agent architecture,
session startup costs, permission model correctness. Knows the internal Claude Code
tool-call lifecycle. Focuses on: what breaks at scale, what is technically correct
vs what merely appears to work, session isolation guarantees.
Questions he would ask: "Does the index stay warm across agent restarts? What is
the MCP handshake cost per tool call? Are deny rules in settings.local.json
actually enforced in sub-agent contexts?"

**P2 — Andrej Karpathy (AI researcher / LLM efficiency advocate)**
Perspective: token economics as first principles. Author of the view that
"attention is the bottleneck." Knows tokenization, context window fill-rate,
and the diminishing returns of large navigation documents. Would ask: "What is
the bits-per-query efficiency of each tool? At what codebase size does jcodemunch's
AST precision outperform grep+read? Is the benchmark measuring exploration tokens
or total session tokens — and which matters for quality?"

**P3 — Junior dev, AI-naive**
Perspective: zero experience with code indexing tools. Uses Claude Code like a
smart terminal. Doesn't think about tokens. Finds multi-step setups ("first index,
then query, then...") confusing and fragile. Would ask: "Why does the index go
stale? What happens if I forget to run graphify? Can't Claude just search the files
itself? Why is there a wiki AND an anatomy file AND a graph — which one wins?"

**P4 — Senior dev, AI-native (DevOps / backend / frontend blend)**
Perspective: 5+ years shipping with LLM tools in production. Cares about:
CI/CD integration of index freshness, DX at team scale, latency budgets, observable
token costs (cost dashboards), and whether the tool stack is maintainable across
hires. Would ask: "Is the graphify index checked into git or regenerated in CI?
What's the index staleness SLA? What happens when two devs commit concurrently?
How do I onboard a contractor who's never used jcodemunch?"

### Additional personas (pre-selected)

**P5 — Security engineer**
Perspective: what data does jcodemunch send over the wire during indexing? Is the
tree-sitter AST index stored locally or uploaded? Supply chain risk of `uvx jcodemunch-mcp`
fetching on-demand. Does graphify-out/graph.json leak internal symbol names if
committed to git? What are the minimum-privilege MCP scopes needed? Is there
a SBOM for any of these tools?

**P6 — ML infra engineer**
Perspective: AST indexing (jcodemunch) and graph summarisation (graphify) are
both deterministic structured approaches. Embedding-based retrieval (e.g. a local
Chroma/FAISS store over chunked source) is a probabilistic alternative that works
across languages without a language-specific parser. Would ask: "At what repo
size does a vector index beat jcodemunch on recall? Is there a hybrid — embed
doc comments, index symbols with AST?" Also: "The benchmark measures chars read,
but does lower exploration cost actually correlate with better implementation
quality? Are we optimising a proxy metric?"

### Council output format

Each council agent reads `RESULTS.md` and `RESULTS-v2.md` and produces:

```markdown
## [Persona name] — Review

### Most important finding
[1-2 sentences on the result that surprised or confirmed a hypothesis]

### What's working
[Bullet list — 2-3 items]

### What's broken or suboptimal
[Bullet list — 2-4 items with specific config/file/metric references]

### Proposed changes (ranked by expected ROI)
1. [Specific change] — estimated token impact: [+/-X%] — effort: [low/med/high]
2. ...

### Open questions
[Things the benchmark didn't measure that would change the verdict]
```

### Aggregation

After all council agents return, aggregate:
1. Count votes: how many personas flagged each issue?
2. Score proposals by (votes × expected_ROI) / effort
3. Output a ranked action list: "Council consensus — top 5 changes"
4. Ask user via MCQ which changes to implement immediately vs defer

---

## Phase 5 — Implement council recommendations

Implement the top-N council changes. These may include:
- Changes to skill files (`.claude/skills/graphify/SKILL.md`)
- Changes to coordinator prompts embedded in this file
- Changes to CLAUDE.md (e.g. annotation on when to use each tool)
- Changes to jcodemunch usage patterns (different tool call sequences)
- Changes to the anatomy/wiki cadence (e.g. "read wiki once per session, not per task")

After implementing, immediately rerun the benchmark (Phase 3) with a v3 output
directory. Write a delta table comparing v1 → v2 → v3.

---

## Phase 6 — Assert improvement

The session is complete when at least one of these is true:
- Best performing config is ≥ 30% below C0 baseline tokens (i.e. tools are net positive)
- Council reaches consensus that further gains require changes outside this session's scope
- 3 iteration cycles have completed

If none are met after 2 cycles, present the council's findings as a report and ask
the user whether to continue or accept the current state.

---

## Notes for the executing agent

- Write all result files before calling advisor or spawning council — results must be
  durable before any review step.
- If any coordinator agent fails (API error, permission block), mark that config as
  `partial` and note the failure mode in RESULTS.md. Do not halt the run.
- jcodemunch sub-agents: MCP tools are NOT inherited by child agents. C3/C5/C6/C7
  configs must run in the main session (not as background sub-agents) OR use a
  coordinator pattern where the main session calls jcodemunch tools and relays
  results into the sub-agent's prompt context.
- The graphify targeted query fix must be verified before C2/C4/C6/C7 configs run.
  A broken fix would make graphify appear even more expensive and invalidate comparisons.
- Call `advisor` before writing the final RESULTS.md to catch aggregation errors.
