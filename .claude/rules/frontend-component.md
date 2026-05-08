---
name: Frontend Component Conventions
paths:
  - "apps/web/components/**/*.tsx"
---

## React Component Rules

- Export a single named component per file matching the filename
- Props interface named `<ComponentName>Props`
- All interactive elements need `aria-label` or must be labelled by visible text
- No direct `AudioEngine` calls in components — go through hooks (`useAudioEngine`, `usePad`)
- Use Tailwind 4 classes; colour tokens from `var(--color-*)` not hex literals
- `loading` states render a spinner, not disabled text
- Variants (primary/secondary/destructive) as a `variant` prop, not separate components
