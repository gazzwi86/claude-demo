# web-ui

_Area: `apps/web/components/ui/` — primitive UI components_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/web/components/ui/Button.tsx

**Description:** Base button primitive used throughout the app. Variants: `primary` (neon-green accent, full background), `secondary` (ghost outline), `destructive` (red tint). Accepts all standard `<button>` HTML props plus a `loading` boolean that renders a spinner. All instances have visible focus rings and support `aria-label`.

---

## apps/web/components/ui/Slider.tsx

**Description:** Accessible range slider. Wraps `<input type="range">` with Tailwind 4 track/thumb styling that matches the dark studio theme. Props: `min`, `max`, `step`, `value`, `onChange`, `aria-label`, optional `label` display. Used by `EffectsRack` for all effect parameters.

---

## apps/web/components/ui/TextField.tsx

**Description:** Text input with label, error message, and optional helper text. Forwards all `<input>` props. Error prop accepts a Zod `FieldErrors` string for inline validation feedback. Used by login and signup forms.
