# CLAUDE.md best practices

## Keep it lean

Boris/Anthropic: bloated CLAUDE.md gets *ignored*. The "Would removing this make Claude make mistakes?" test — if the answer is "no", remove it.

## Size budgets

- Top-level `CLAUDE.md`: ≤100 lines.
- Per-folder `CLAUDE.md`: ≤200 lines.
- Anything longer: cluster into `.claude/rules/<topic>.md` with `paths:` glob frontmatter so it only loads where relevant.

## Lift verifiable rules into hooks

Some rules are checkable by code, not by reminding Claude:

- "Cyclomatic complexity must be <10" → `PostToolUse:Edit` running `eslint --rule complexity` on the edited file.
- "All tests must pass before merging" → `Stop` running `npm test` if changed files are test-relevant.
- "No console.log in src/" → `PostToolUse:Edit|Write` regex check.

If a rule can be enforced deterministically, prefer the hook. CLAUDE.md is for guidance, not for things a script can verify.

## Cluster-and-extract pattern

Long CLAUDE.md → split by topic:

1. Cluster by markdown heading.
2. For each cluster, propose a `.claude/rules/<topic>.md` with `paths:` glob.
3. Folder-mention clusters → propose `apps/<area>/CLAUDE.md` extraction.
4. Top-level becomes navigation index.

## `/clear` discipline

Boris/Anthropic: second correction = `/clear`, not third fix. Stale context corrupts new work.

## Common mistakes

- Restating language docs ("React components return JSX"): don't.
- Code samples that drift: extract to `.claude/rules/` with paths glob, or just delete.
- Per-environment guidance: belongs in env vars or scripts, not CLAUDE.md.
