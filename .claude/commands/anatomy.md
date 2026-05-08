---
name: anatomy
description: Generate or refresh the repo's structured wiki — top-level ANATOMY.md plus per-area pages under docs/wiki/.
---

# /anatomy

Generates and maintains a structured "anatomy" of the codebase, modelled on Karpathy's LLM-wiki concept (a persistent, compounding artifact that an LLM owns and keeps in sync).

## Output structure

```
ANATOMY.md           ← top-level index: file tree + one-line per file + status badges + links to associated wiki below
docs/wiki/           ← per-area pages
├── core.md          ← src/*.js (top-level files only)
├── routes.md        ← src/routes/*
├── services.md      ← src/services/*
├── middleware.md    ← src/middleware/*
├── models.md        ← src/models/*
├── utils.md         ← src/utils/*
├── cache.md         ← src/cache/*
├── db.md            ← src/db/*
└── tests.md         ← tests/*
```

## Areas → file mapping

For any source file, the area is its first directory under `src/` (or `tests` for tests). Top-level `src/*.js` map to `core.md`. The `area-for-path` mapping is also implemented in `.claude/scripts/modules/common.py` (`area_for_path`) and used by the `mark-anatomy-stale` and `check-anatomy-fresh` hooks.

## Per-area page format

```markdown
# <Area>

## <relative/path/to/file.js>

**Description:** <one paragraph: what this file is responsible for>

### Functions

- **`functionName(params)`** — <one-line description>
- **`otherFn(args)`** — <one-line description>

### Exports

`module.exports = { ... }` — list

### Depends on

- `./relative-import` (functions used)
- external: none (zero-dep)

---
(repeat per file in this area)
```

For non-JS files (markdown, json, etc.) under a tracked path, include them with **filepath + description** only — no functions section.

## ANATOMY.md format

```markdown
# Repository Anatomy

_Last full refresh: <ISO timestamp>_

## File tree

<tree showing all tracked source files>

## Areas

- [Core](docs/wiki/core.md) — N files
- [Routes](docs/wiki/routes.md) — N files
- ...

## Stale entries

<files whose wiki page is currently stale>
```

## Modes

### Full refresh (`/anatomy` with no args)

1. Walk `src/` and `tests/`. For each file:
   - Read it.
   - Determine its area.
   - Extract functions (top-level `function`, `const x = (..) =>`, `class` methods).
   - Write a description (one short paragraph) and per-function one-liners.
2. Rewrite each `docs/wiki/<area>.md` from scratch with the consolidated content for that area.
3. Rewrite `ANATOMY.md` with the file tree, area links, file counts, and an empty "Stale entries" section.
4. Append a line to `docs/wiki/log.md`: `<ISO> full-refresh by /anatomy`.

### Incremental refresh (`/anatomy refresh <files...>`)

Used by the git pre-commit hook with the staged files.

1. For each input file, find its area.
2. For each touched area, regenerate ONLY the entries for the changed files within that area's wiki page (preserve other entries).
3. Remove the corresponding `<!-- stale: ... -->` markers from the touched area pages.
4. Update `ANATOMY.md`'s "Stale entries" section.
5. Append `<ISO> incremental: <files>` to `docs/wiki/log.md`.

### Lint (`/anatomy lint`)

Read-only health check. Report:
- Files in `src/` or `tests/` that have no entry in any wiki page.
- Wiki entries that point to files that no longer exist.
- Stale markers in wiki pages.
- Cross-reference contradictions (best-effort).

Do not modify any files in lint mode. Print a summary to the user.

## Constraints

- Never delete files; only modify `ANATOMY.md` and `docs/wiki/**`.
- Preserve any markdown comments that are not the `<!-- stale: ... -->` markers.
- One paragraph descriptions are MAX three sentences.
- Function descriptions are ONE line, no lists.
- No marketing language; describe what the code does.
- Skip files larger than 50 KB (note them in the wiki page with `_skipped: too large_`).
