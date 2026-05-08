---
name: write-rtl-test
description: Guide for writing React Testing Library component tests for apps/web. Invoke when the user says "write component test", "test this component", "add RTL test", or "add a test for <ComponentName>".
---

# Write a React Testing Library test

Follow these steps. For API/service tests use `/write-vitest-test`. For E2E use `/write-playwright-test`.

## Step 1 — Identify the component

Find the component under `apps/web/components/`. Note its subdirectory:

- Studio components → `apps/web/components/studio/<ComponentName>.tsx`
- Primitive UI → `apps/web/components/ui/<ComponentName>.tsx`

## Step 2 — Create the test file

Place it alongside the component:

```
apps/web/components/<area>/<ComponentName>.test.tsx
```

## Step 3 — Set up imports

```ts
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentName } from "./<ComponentName>.js";
```

## Step 4 — Mock Web Audio APIs

`AudioContext` and related APIs are not available in jsdom. Mock them at the top of the file:

```ts
vi.mock("../../lib/audio/engine.js", () => ({
  AudioEngine: vi.fn().mockImplementation(() => ({
    /* stub methods the component calls */
  })),
}));
```

Or mock at the hook level if the component uses `useAudioEngine` or `usePad`.

## Step 5 — Write assertions

Prefer accessible queries in this order:

1. `screen.getByRole("button", { name: /label/i })`
2. `screen.getByLabelText(/label/i)`
3. `screen.getByText(/text/i)`

Avoid `getByTestId` unless the element has no accessible role or label.

## Step 6 — Apply testing rules

From `.claude/rules/testing-rtl.md`:

- No snapshot tests.
- Assert specific aria/text values, not just presence.
- Use `userEvent` (not `fireEvent`) for user interactions.
- Each test case must be independent — no shared mutable state.

## Checklist before finishing

- [ ] Test file placed next to the component
- [ ] Audio APIs mocked
- [ ] Accessible queries used (`getByRole`, `getByLabelText`)
- [ ] No snapshot tests
- [ ] `userEvent` used for interactions
- [ ] Assertions check specific values
