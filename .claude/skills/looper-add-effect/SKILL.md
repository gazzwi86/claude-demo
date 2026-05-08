---
name: looper-add-effect
description: Guide for adding a new audio effect (reverb, delay, filter, or custom node) to the music looper. Invoke when the user says "add an effect", "add a new audio node", "add reverb", "add delay", "add filter", or any request to extend the effects chain.
---

# Add a new audio effect

Follow these steps in order. Do not skip any — each layer depends on the previous.

## Step 1 — Extend the shared type (if defined there)

Check `packages/shared/src/types.ts` for an `EffectsParams` type or interface.

- If it exists there, add the new param(s) to it.
- If it only lives in `apps/web/lib/audio/effects.ts`, update it there only.

## Step 2 — Extend `EffectsParams` and `DEFAULT_EFFECTS`

File: `apps/web/lib/audio/effects.ts`

- Add the new param(s) to the `EffectsParams` interface.
- Add matching default values to `DEFAULT_EFFECTS`.
- If the effect has an on/off toggle, use a `boolean` field (e.g. `reverbEnabled`).
- If it has a continuous parameter, use `number` in a 0–1 or named range.

## Step 3 — Wire the audio node in the engine

File: `apps/web/lib/audio/engine.ts`, `setEffects()` method.

- Instantiate the Web Audio node (e.g. `ConvolverNode`, `BiquadFilterNode`, `DelayNode`).
- Connect it into the effects chain at the correct position.
- Use `param.setTargetAtTime(value, ctx.currentTime, 0.01)` — **never** assign `.value` directly.
- Disconnect and reconnect nodes when toggling on/off; do not leave dangling connections.

## Step 4 — Add the UI control

File: `apps/web/components/studio/EffectsRack.tsx`

- Add a `<Slider>` (or `<Switch>` for toggles) wired to the new param.
- Every slider and switch **must** have an `aria-label` attribute.
- Keep UI order consistent with audio chain order.
- Read current value from the store / engine state; dispatch the update on change.

## Step 5 — Export updated types

If `EffectsParams` lives in `packages/shared/src/types.ts`, confirm it is re-exported from `packages/shared/src/index.ts`.

## Checklist before finishing

- [ ] `EffectsParams` interface updated
- [ ] `DEFAULT_EFFECTS` has the new param
- [ ] Audio node wired in `setEffects()` using `setTargetAtTime`
- [ ] UI control added with `aria-label`
- [ ] No dangling audio node connections
- [ ] Shared types re-exported if changed
