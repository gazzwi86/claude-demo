---
name: anatomy
description: Generate or refresh the repo's structured wiki — top-level ANATOMY.md plus per-area pages under docs/wiki/.
---

# /anatomy

Generates and maintains a structured "anatomy" of the codebase: a
persistent, compounding artifact that an LLM owns and keeps in sync.

## Output structure

```
ANATOMY.md           ← top-level index: file tree + one-line per file + links to per-area wiki pages
docs/wiki/           ← per-area pages, one markdown file per logical area
└── <area>.md
```

## Areas → file mapping

For any source file, the **area** is determined by the project layout.
Map paths to areas via `.claude/scripts/modules/common.py` (`area_for_path`).
Update the mapping when new top-level dirs are added; the
`mark-anatomy-stale` PostToolUse hook reads it.

## Per-area page format

```markdown
# <Area>

## <relative/path/to/file.ext>

**Description:** <one paragraph: what this file is responsible for>

### Exports

- `<exportName>` — <signature> — <one-line description>

### Dependencies

- `<imported file or package>` — <why>

### Tests

- `<test file>` — <what it covers>
```

## Top-level ANATOMY.md format

A file tree of the project with one line per file describing what it is,
plus a "Last regenerated" timestamp and links to each `docs/wiki/*.md`.

## How to run

`/anatomy` — full regeneration. Reads every source file, regenerates
all per-area pages and the top-level index. Slow on large repos.

`/anatomy <path>` — incremental: re-read only files under `<path>` and
update the corresponding per-area pages + ANATOMY.md row.

## Freshness

The PostToolUse hook `mark-anatomy-stale` writes a marker file
`.claude/anatomy-stale` whenever a tracked source file is modified.
The pre-push git hook reads this and refuses to push if stale; running
`/anatomy` clears the marker.

## Initial setup

Before first run, edit `area_for_path` in
`.claude/scripts/modules/common.py` to map this repo's directory layout
to area names. Default mapping treats every top-level directory under
`src/` as its own area.
