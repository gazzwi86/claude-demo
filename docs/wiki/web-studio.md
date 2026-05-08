# web-studio

_Area: `apps/web/components/studio/` — domain UI components_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/web/components/studio/TransportBar.tsx

**Description:** Global transport controls bar at the top of the studio. Provides play/stop-all, BPM display, and master record trigger. Calls `engine.stopAll()` and `engine.resume()` via `useAudioEngine`. All controls have `aria-label` and visible focus rings.

---

## apps/web/components/studio/PadGrid.tsx

**Description:** Renders the 4×4 grid of 16 `Pad` components. Iterates pad indices 0–15, calls `usePad(engine, index)` for each, and passes state + action callbacks to `Pad`. Manages the `selectedPad` state for library load targeting.

---

## apps/web/components/studio/Pad.tsx

**Description:** Single pad cell in the 4×4 grid. Renders as empty (dashed border, "+ load" prompt) or loaded, with colour and glow communicating state — dim for loaded-but-stopped, neon-green for playing. Exposes inline Mute (M) and Solo (S) buttons and a central play/stop toggle. Volume and playback-rate sliders appear on `sm:` breakpoint and above; all controls have `aria-label`.

### Exports

- **`Pad(props)`** — named component; all audio mutations delegate outward via `onMute`, `onSolo`, `onVolume`, `onRate`, `onToggle`; clicking an empty pad fires `onSelect` to open the library drawer
- **`PadProps`** — props interface exported for use by `PadGrid`

### Depends on

- `clsx`
- `@/components/ui/Slider`
- `@/lib/audio/engine` (PadState type)

---

## apps/web/components/studio/EffectsRack.tsx

**Description:** Master effects panel. Exposes `Slider` controls for master volume, delay time + feedback + mix, reverb mix, and lowpass filter cutoff + Q. Each slider change calls `engine.setEffects()` with the updated partial. Reads `DEFAULT_EFFECTS` for initial values.

---

## apps/web/components/studio/LoopRecorder.tsx

**Description:** Record-from-mic UI. Walks through the arm → record → stop flow with a live `Meter` showing input level. After recording, previews the blob on a pad before committing. Uses `useRecorder` hook for state management.

---

## apps/web/components/studio/LibraryDrawer.tsx

**Description:** Slide-in panel listing available loops: bundled synth samples (always available) and user-uploaded loops fetched from `/loops` when authenticated. Supports tap-to-load onto the selected pad and drag-to-pad. Calls `engine.loadPadBuffer()` for synth samples, `engine.loadPad(url)` for API loops.

---

## apps/web/components/studio/Meter.tsx

**Description:** Animated RMS level meter. Polls a provided `getRms()` callback in a `requestAnimationFrame` loop and renders a single coloured bar proportional to level. Used in the TransportBar (master level) and LoopRecorder (input level).

