# Claude Code Demo Project

This is a Node.js REST API (no frameworks beyond Node stdlib). It demonstrates
Claude Code configuration features for an engineering team demo.

## Project structure

- `src/` — application code (routes, models, middleware, utils)
- `tests/` — test files using Node's built-in test runner
- `.claude/` — Claude Code configuration (settings, rules, agents, commands)
- `scripts/` — helper scripts (hooks, automation)

## Commands

- `npm start` — start the server
- `npm run dev` — start with --watch for live reload
- `npm test` — run tests via `node --test`
- `npm run lint` — run linter

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
