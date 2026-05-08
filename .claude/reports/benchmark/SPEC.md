# Benchmark Spec — Tool Comparison

Generated: 2026-05-08

## Goal
Measure real exploration cost (chars read / tokens) for 5 coding tasks across 8 tool configurations.
Agents explore to understand what to change, then write a code sketch. No source file modifications.

## Working Directory
/Users/gareth/Sites/claude-demo

## Tool Configurations

| ID | Name | Instructions |
|----|------|-------------|
| c0 | baseline | Use only Read, Grep, Glob, Bash. No graphify, no ANATOMY.md/wiki, no jcodemunch. |
| c1 | anatomy | Start: read ANATOMY.md, then most relevant docs/wiki/*.md for the task. Then Read/Grep/Glob. No graphify, no jcodemunch. |
| c2 | graphify | Start: read graphify-out/GRAPH_REPORT.md, optionally parse graphify-out/graph.json. Then Read/Grep/Glob. No ANATOMY.md/wiki, no jcodemunch. |
| c3 | jcodemunch | Use jcodemunch MCP tools: resolve_repo → index_folder if not indexed → search_symbols → get_symbol_source → find_references. Minimise Read/Grep/Glob. No graphify, no ANATOMY.md/wiki. |
| c4 | anatomy+graphify | Start: ANATOMY.md + relevant wiki page + graphify-out/GRAPH_REPORT.md. Then Read/Grep/Glob. No jcodemunch. |
| c5 | anatomy+jcodemunch | Start: ANATOMY.md + relevant wiki page. Then jcodemunch tools. Minimise Read/Grep/Glob. No graphify. |
| c6 | graphify+jcodemunch | Start: graphify-out/GRAPH_REPORT.md. Then jcodemunch tools. Minimise Read/Grep/Glob. No ANATOMY.md/wiki. |
| c7 | all | Start: ANATOMY.md + relevant wiki page + graphify-out/GRAPH_REPORT.md. Then jcodemunch tools. |

## Tasks

### T1 — padnode_fadein (Simple: 1 file)
Add `fadeIn(durationMs: number): void` to `PadNode`. When called while playing: ramp gain from 0 to current volume over durationMs via `linearRampToValueAtTime`. When not playing: no-op.
Key question: how does PadNode manage gain? What does play() do to gain?

### T2 — engine_playing_count (Simple-Medium: 1 file)
Add to `AudioEngine`: (1) `getPlayingCount(): number` — pads currently in playing state. (2) `getPadStates(): PadState[]` — shallow copy of internal pad state array.
Key question: how does Engine track pad play state internally? What is PadState?

### T3 — loop_tags (Medium: 2-3 files, cross-package)
Add `tags: z.array(z.string()).max(10).optional()` to `CreateLoopSchema` and `UpdateLoopSchema` in `@looper/shared`. Update `NewLoopInput` interface and `createLoop` + `updateLoop` in the DynamoDB layer.
Key question: where is the schema? How does NewLoopInput map to DynamoDB? What does updateLoop currently handle?

### T4 — loops_search (Hard: 4 files)
Add `GET /loops/search?q=<query>` (or modify existing list endpoint) to search user's loops by name substring. Needs: (1) query param schema in @looper/shared, (2) `searchUserLoops(userId, query)` in db layer, (3) service function, (4) route handler.
Key question: what is the current list endpoint structure? How does db layer query DynamoDB? How does route connect to service?

### T5 — effects_bypass (Complex: 3-4 files)
Add `bypass: boolean` to `EffectsBus`. When true: route audio directly from input gain to destination, bypassing filter/delay/reverb. Add `setBypass(bypass: boolean)` method. Update `EffectsParams`, `AudioEngine` effects state, and `EffectsRack.tsx` toggle button.
Key question: how does EffectsBus connect nodes? How does Engine store/apply effects? How does EffectsRack render controls?

## Result File Format

Each agent writes to: `.claude/reports/benchmark/T[n]-C[n]-[config_name].md`

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
