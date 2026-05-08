---
name: Testing — React Testing Library
paths:
  - "apps/web/**/*.test.tsx"
  - "apps/web/**/*.spec.tsx"
---

## React Component Test Rules

- Use Vitest + `@testing-library/react` (RTL) for component tests
- Import `render`, `screen`, `fireEvent`/`userEvent` from `@testing-library/react`
- Use `screen.getByRole` / `getByLabelText` queries — prefer accessible selectors over `getByTestId`
- Prefer `userEvent.setup()` over `fireEvent` for interaction
- Mock audio nodes — `AudioContext`, `AudioBufferSourceNode`, etc. are not available in jsdom
- No snapshot tests; assert specific text/state/aria attributes
