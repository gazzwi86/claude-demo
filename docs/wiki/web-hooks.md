# web-hooks

_Area: `apps/web/hooks/`_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/web/hooks/useAudioEngine.ts

**Description:** Singleton-per-page React hook that owns the `AudioContext`. The engine is lazily constructed on first `resume()` call — browsers require a user gesture before creating an AudioContext. Once created, it lives for the full page lifetime and is destroyed on unmount via `useEffect` cleanup.

### Exports

- **`useAudioEngine()`** — returns `{ engine: AudioEngine | null, ready: boolean, resume: () => Promise<void> }`
- **`interface UseAudioEngineResult`** — return type

### Depends on

- `@/lib/audio/engine` (AudioEngine)
- `@looper/shared` (PAD_GRID_SIZE)

---

## apps/web/hooks/usePad.ts

**Description:** React hook for a single pad slot in the grid. Reads per-pad state from the engine and exposes callbacks for toggle, load, volume, mute, solo, playback rate, and filter cutoff changes.

### Exports

- **`usePad(engine, index)`** — returns `{ state: PadState, toggle, load, setVolume, setMuted, setSolo, setRate, setCutoff }`

### Depends on

- `@/lib/audio/engine` (AudioEngine, PadState)

---

## apps/web/hooks/useRecorder.ts

**Description:** React hook wrapping `LoopRecorderEngine`. Manages recorder state transitions and exposes arm/start/stop/disarm controls to the `LoopRecorder` component. Level updates trigger re-renders via `useState`.

### Exports

- **`useRecorder(engine)`** — returns `{ state: RecorderState, level: number, arm, start, stop, disarm }`; `level` is RMS input for the level meter

### Depends on

- `@/lib/audio/recorder` (LoopRecorderEngine)
- `@/lib/audio/engine` (AudioEngine)
