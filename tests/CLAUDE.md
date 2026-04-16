# Test Guidelines

This file is only loaded when Claude works inside `tests/`.

## Test framework

We use Node's built-in test runner (`node:test`) and assertion module (`node:assert`).
Do NOT use Jest, Mocha, or any external test framework.

## Test conventions

- File naming: `<module>.test.js`
- Use `describe` / `it` blocks from `node:test`
- Use `assert.strictEqual`, `assert.deepStrictEqual` — avoid loose equality
- Each test should create its own store instance (no shared mutable state)
- Test the public API of each module, not internal implementation details
