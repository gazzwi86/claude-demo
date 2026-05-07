# Claude Code Demo Project

This is a Node.js REST API (no frameworks beyond Node stdlib). It demonstrates
Claude Code configuration features for an engineering team demo.

## Project structure

- `src/` — application code (routes, models, middleware, utils)
- `tests/` — test files using Node's built-in test runner
- `.claude/` — Claude Code configuration (settings, rules, agents, commands, skills)
- `.claude/scripts/` — Claude-only scripts: hook dispatcher (`hooks.py`), `statusline.sh`, `setup-graphify.sh`, `git-hooks/`

## Commands

- `npm start` — start the server
- `npm run dev` — start with --watch for live reload
- `npm test` — run tests via `node --test`
- `npm run lint` — run linter
- `/setup` — wire git hooks and make scripts executable (idempotent). `/setup graphify` also installs the graphify index.
- `python3 .claude/scripts/hooks.py check-anatomy-fresh` — ad-hoc wiki freshness check (the pre-push hook calls this for you).

## Navigation — read these before grepping

- **`ANATOMY.md`** (top-level) and **`docs/wiki/<area>.md`** are the LLM-maintained map of this repo. Consult them first to find the right area before reading files. Per-area pages list every file with a one-line description, the functions it exports, and its dependencies.
- The `area-for-path` mapping (which source file maps to which wiki page) lives in `.claude/scripts/hooks.py`.

## Conventions

- Use CommonJS (`require`/`module.exports`), not ESM
- No external dependencies — this is a zero-dep demo project
- All responses are JSON with appropriate status codes
- Use Node's built-in test runner (`node:test`), not Jest or Mocha

## Code style

- 2-space indentation
- Double quotes for strings
- Always use `const` unless reassignment is needed
- Prefer early returns over nested conditionals

## graphify

If `graphify-out/graph.json` exists, this project has a graphify knowledge graph.

Rules:
- For cross-file callsite or dependency lookups, prefer asking graphify (`use graphify to ...`) over `Grep`/`Glob` — it's cheaper and more accurate on this repo.
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost).
- The `PreToolUse:Glob|Grep` hook (`hooks.py pre-tool-use graphify-hint`) injects a reminder of this whenever the index is present.
