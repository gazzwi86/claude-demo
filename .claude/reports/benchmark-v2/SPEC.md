# Benchmark Spec v2 — Tool Comparison

Generated: 2026-05-08

## Changes from v1

- **Graphify fix**: C2/C4/C6/C7 configs now use targeted `graph.json` node queries
  (via `node -e` or `jq`) instead of reading `graphify-out/GRAPH_REPORT.md` wholesale.
  Validated: 1,350 chars vs 13,778 chars — 90% reduction per query.
- **jcodemunch**: C3/C5/C6/C7 now run. All 8 configs run in main session (jcodemunch MCP
  not inherited by sub-agents).
- **Methodology**: All configs run in main session, sequentially. v2 C0 is the new
  reference baseline for v2 deltas. v1 vs v2 delta is informational only (method changed).
- **Sourcegraph/greptile**: Not included. Wrong scale for a 213-node monorepo.
  Sourcegraph value is cross-repo at million-LOC; greptile is conversational Q&A
  (instruments badly for char-cost measurement).

## Goal

Measure real exploration cost (chars read / tokens) for 5 coding tasks across 8 tool
configurations. Main session executes each config's allowed tools, tracking exact char
count returned by each call. No source file modifications; agent produces a code sketch.

## Working Directory

/Users/gareth/Sites/claude-demo

## jcodemunch repo

Repo ID: `local/claude-demo-1cd8bfbe`
Indexed at: 2026-05-08T15:52:00 — 8,412 symbols, 115 files (worktrees excluded)

## Tool Configurations

| ID | Name | Instructions |
|----|------|-------------|
| c0 | baseline | Use only Read, Grep, Glob, Bash. No graphify, no ANATOMY.md/wiki, no jcodemunch. |
| c1 | anatomy | Start: read ANATOMY.md, then most relevant docs/wiki/*.md for the task. Then Read/Grep/Glob. No graphify, no jcodemunch. |
| c2 | graphify-fixed | Start: targeted graph.json node query (node -e / jq). Do NOT read GRAPH_REPORT.md. Then Read/Grep/Glob. No ANATOMY.md/wiki, no jcodemunch. |
| c3 | jcodemunch | Use jcodemunch MCP tools: search_symbols → get_symbol_source → find_references. Minimise Read/Grep/Glob. No graphify, no ANATOMY.md/wiki. |
| c4 | anatomy+graphify-fixed | Start: ANATOMY.md + relevant wiki page + targeted graph.json query. Do NOT read GRAPH_REPORT.md. Then Read/Grep/Glob. No jcodemunch. |
| c5 | anatomy+jcodemunch | Start: ANATOMY.md + relevant wiki page. Then jcodemunch tools. Minimise Read/Grep/Glob. No graphify. |
| c6 | graphify+jcodemunch | Start: targeted graph.json node query. Then jcodemunch tools. Minimise Read/Grep/Glob. No ANATOMY.md/wiki. |
| c7 | all | Start: ANATOMY.md + relevant wiki page + targeted graph.json query. Then jcodemunch tools. |

### Graphify targeted query pattern (C2/C4/C6/C7)

```bash
node -e "
  const g = JSON.parse(require('fs').readFileSync('graphify-out/graph.json','utf8'));
  const node = g.nodes.find(n => n.label.includes('TARGET'));
  const links = g.links.filter(e => e.source===node?.id || e.target===node?.id);
  console.log(JSON.stringify({node, links}, null, 2));
"
```

Cost: ~200-1,500 chars per query (vs 13,778 for full GRAPH_REPORT.md).

## Tasks

### T1 — padnode_fadein (Simple: 1 file)

Add `fadeIn(durationMs: number): void` to `PadNode`. When called while playing: ramp gain from 0
to current volume over durationMs via `linearRampToValueAtTime`. When not playing: no-op.
Key question: how does PadNode manage gain? What does play() do to gain?

### T2 — engine_playing_count (Simple-Medium: 1 file)

Add to `AudioEngine`: (1) `getPlayingCount(): number` — pads currently in playing state.
(2) `getPadStates(): PadState[]` — shallow copy of internal pad state array.
Key question: how does Engine track pad play state internally? What is PadState?

### T3 — loop_tags (Medium: 2-3 files, cross-package)

Add `tags: z.array(z.string()).max(10).optional()` to `CreateLoopSchema` and `UpdateLoopSchema`
in `@looper/shared`. Update `NewLoopInput` interface and `createLoop` + `updateLoop`
in the DynamoDB layer.
Key question: where is the schema? How does NewLoopInput map to DynamoDB? What does updateLoop
currently handle?

### T4 — loops_search (Hard: 4 files)

Add `GET /loops/search?q=<query>` (or modify existing list endpoint) to search user's loops
by name substring. Needs: (1) query param schema in @looper/shared, (2) `searchUserLoops(userId,
query)` in db layer, (3) service function, (4) route handler.
Key question: what is the current list endpoint structure? How does db layer query DynamoDB?
How does route connect to service?

### T5 — effects_bypass (Complex: 3-4 files)

Add `bypass: boolean` to `EffectsBus`. When true: route audio directly from input gain to
destination, bypassing filter/delay/reverb. Add `setBypass(bypass: boolean)` method. Update
`EffectsParams`, `AudioEngine` effects state, and `EffectsRack.tsx` toggle button.
Key question: how does EffectsBus connect nodes? How does Engine store/apply effects?
How does EffectsRack render controls?

## Char counting rules

- **Read tool**: chars = len(file_content_returned)
- **Grep/Glob tool**: chars = len(output_returned)
- **Bash (graph query)**: chars = len(stdout)
- **jcodemunch tool**: chars = len(full_JSON_response_string) — includes wrapper metadata
- **chars_relevant**: chars from sources that directly informed the code sketch
- **chars_wasted**: chars_total - chars_relevant

## Result File Format

Each config+task writes to: `.claude/reports/benchmark-v2/T{n}-C{n}-{config_name}.md`

```
---METRICS---
config: c0
config_name: baseline
task: t1
task_name: padnode_fadein
task_completed: yes|partial|no

exploration_steps:
  - {step: 1, tool: Read, target: "apps/web/lib/audio/padNode.ts", chars: 3086, relevant: yes}
  - {step: 2, tool: Grep, target: "playing in apps/", chars: 245, relevant: yes}

totals:
  steps: N
  chars_total: XXXX
  chars_relevant: YYYY
  chars_wasted: ZZZZ
  tokens_estimated: AAAA

files_that_need_changing:
  - apps/web/lib/audio/padNode.ts

proposed_change: |
  Brief code sketch here

---END METRICS---
```
