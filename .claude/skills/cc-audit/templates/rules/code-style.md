---
description: Code style rules. Path-globbed; override per language.
paths: ["**/*"]
---

## Code Style

- Match the language's idiomatic style — no cross-language formatting transplants.
- Prefer immutability: `const`/`final`/`val` over `let`/`var` where the language supports it.
- Functions should do one thing — split if longer than 30 lines.
- Descriptive names; avoid single letters except for loop indices and well-known math vars.
- No commented-out code in commits — delete or move to notes.
- No TODOs without an owner or ticket reference.
