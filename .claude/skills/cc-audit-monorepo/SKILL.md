---
name: cc-audit-monorepo
description: Audits monorepo-specific configuration. Detects pnpm-workspace.yaml, lerna.json, nx.json, turbo.json, apps/, packages/, services/, multiple language manifests at depth ≥1. Recommends per-area apps/<area>/CLAUDE.md, path-globbed .claude/rules/*.md, deny-list union, sparse-checkout to limit worktree disk explosion. Skipped on single-package repos. Use when the user invokes /cc-audit, asks to "audit monorepo config", "scaffold per-area CLAUDE.md", or "set up sparse checkouts".
when_to_use: Orchestrator fan-out for /cc-audit on a monorepo, or a direct request to review monorepo Claude Code config.
allowed-tools: ["Read", "Glob", "Grep"]
---

# cc-audit-monorepo

Inspects monorepo workspace structure. **Skipped if single-package**.

## Run

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-monorepo/inspect.py <repo-root> --json
```

## Detection signals

- `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json` at root.
- `apps/`, `packages/`, `services/` directories.
- Multiple language manifests at depth ≥1 (`package.json`, `pyproject.toml`, etc.).

## What it checks

- Per-area `apps/<area>/CLAUDE.md` scaffolded for each app/package/service.
- `.claude/rules/*.md` have `paths:` globs (rules apply per-area, not globally).
- Deny list is a union across packages (don't fragment).
- Sparse-checkout / worktree settings to limit disk explosion (community gotcha #5).
- `area_for_path()` mapping helper present in `hooks.py` (or recommend adding).

## Gotchas

- Worktree disk explosion: each agent worktree clones the whole tree by default. Sparse checkouts or symlinks for `.claude/` are essential.
- Per-area CLAUDE.md only loads when files in that area are touched — keep ≤200 lines.
- A path-globbed rule can apply to multiple areas; design globs intentionally.

## Reference

The local repo at `/Users/gareth/Sites/claude-demo` is itself a monorepo with `apps/`, `packages/`, `infra/`, `pnpm-workspace.yaml` — see [its CLAUDE.md](../../../Sites/claude-demo/CLAUDE.md) Layout map.

See [best-practises.md](best-practises.md).
