# Monorepo audit best practices

See `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/best-practises/monorepo.md` for the canonical reference.

## Audit checklist

- [ ] Each `apps/<area>/`, `packages/<name>/`, `services/<name>/` has a CLAUDE.md.
- [ ] All `.claude/rules/*.md` have `paths:` globs narrowed to relevant areas.
- [ ] Top-level CLAUDE.md has a Layout map pointing at per-area files.
- [ ] `area_for_path()` helper present in `hooks.py` if path-routing hooks exist.
- [ ] Sparse-checkout / worktree disk-limit guidance in CLAUDE.md.

## Detection signals (require ≥1 to fire)

- `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json` at root.
- `apps/`, `packages/`, `services/` directories with ≥1 child.
- Multiple language manifests at depth ≥1.
