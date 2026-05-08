---
name: write-component
description: Guide for creating a new React component in apps/web. Invoke when the user says "create a component", "add UI component", "build a <Name> component", or "add a new React component".
---

# Create a new React component

Follow these steps. For E2E tests use `/write-playwright-test`. For component tests use `/write-rtl-test`.

## Step 1 — Determine placement

- **Primitive UI** (buttons, inputs, sliders, no domain logic) → `apps/web/components/ui/`
- **Domain / studio** (pads, transport, effects, recorder, anything looper-specific) → `apps/web/components/studio/`

When in doubt, prefer `studio/` — promote to `ui/` only if the component would be genuinely reusable outside the looper domain.

## Step 2 — Create the file

Filename: `<ComponentName>.tsx`. Use PascalCase matching the export name.

```
apps/web/components/<area>/<ComponentName>.tsx
```

## Step 3 — Define props interface

```ts
interface <ComponentName>Props {
  // every prop explicitly typed
}

export function <ComponentName>({ ... }: <ComponentName>Props) {
  // ...
}
```

Named export matching the filename — no default exports.

## Step 4 — Accessibility

Every interactive element must be labelled:

- Buttons: visible text or `aria-label`.
- Sliders/inputs: `aria-label` or `<label htmlFor>`.
- Icon-only controls: always `aria-label`.

## Step 5 — Audio access

Never call `AudioEngine` directly from a component. Go through the established hooks:

- `useAudioEngine()` — global engine state and dispatch.
- `usePad(padId)` — per-pad state and controls.

## Step 6 — Styles

Use Tailwind 4 utility classes. For brand colours use CSS custom property tokens from `apps/web/app/globals.css`:

```tsx
className="bg-[var(--color-surface)] text-[var(--color-on-surface)]"
```

Do not add inline `style` objects for colours — always use the token system.

## Step 7 — Write a test

Follow `/write-rtl-test` to create `apps/web/components/<area>/<ComponentName>.test.tsx`.

## Checklist before finishing

- [ ] File placed in correct subdirectory (`ui/` vs `studio/`)
- [ ] Named export matches filename
- [ ] Props interface defined
- [ ] All interactive elements have `aria-label` or visible label
- [ ] Audio access goes through `useAudioEngine` or `usePad`
- [ ] Colours use CSS token variables, not hardcoded values
- [ ] RTL test created
