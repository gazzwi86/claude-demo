# Monorepo best practices

## Detection signals

- `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json` at root.
- `apps/`, `packages/`, `services/` directories.
- Multiple language manifests at depth ≥1 (`package.json`, `pyproject.toml`).

## Per-area CLAUDE.md

Each `apps/<area>/CLAUDE.md` overrides global rules within its tree. Keep ≤200 lines. Reference in the top-level Layout map:

```
| Path | What it is | Conventions live in |
|---|---|---|
| `apps/web/` | Next.js frontend | `apps/web/CLAUDE.md` |
| `apps/api/` | Fastify backend | `apps/api/CLAUDE.md` |
```

## Path-globbed rules

`.claude/rules/<topic>.md` with `paths:` frontmatter applies only to matching files:

```yaml
---
description: Python style
paths: ["apps/api/**/*.py", "packages/etl/**/*.py"]
---
```

## Deny-list union

A monorepo's deny list is the union of per-area concerns: an apps/ deny stays project-wide. Don't fragment.

## Sparse checkouts / worktrees

Worktree disk explosion is real. For agents that fork worktrees, configure sparse-checkout patterns at the area level, or symlink shared `.claude/` into worktrees.

## `area_for_path` helper

For hooks that need to route by file location (e.g. mark anatomy stale, run package-specific tests), implement `area_for_path()` that maps `apps/<app>/<top>/...` and `packages/<name>/...` to a canonical area key. See the local repo's `hooks.py:71` for a reference implementation.

## Native tools

`/anatomy` (LLM-maintained per-area wiki) and `graphify` (knowledge graph for cross-file deps) shine in monorepos. Detect repo size: if >200 files and these aren't installed, recommend.
