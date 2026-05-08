---
name: Code Style
---

## Code Style Rules

- TypeScript + ESM only. Use `import` / `export`, never `require` / `module.exports`. `"type": "module"` in every package.json.
- On relative TS imports across compiled boundaries, use a `.js` extension (Node ESM resolution).
- 2-space indentation, double quotes.
- Prefer `const` over `let`; never use `var`.
- Functions should do one thing — if a function is longer than 30 lines, split it.
- Use descriptive variable names; avoid single-letter names except in loops.

(Python in `.claude/scripts/` is the exception; it follows PEP8 and uses standard imports — the rule above applies to app/package code.)
