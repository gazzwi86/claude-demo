# web-audio

_Area: `apps/web/lib/audio/` — Web Audio API engine_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/web/lib/audio/engine.ts

**Description:** Owns the singleton `AudioContext`, master `EffectsBus`, and a `Map<number, PadNode>` keyed by pad index. The React layer wraps this behind `useAudioEngine`; the engine is pure imperative logic with no React dependency and is safe to test outside jsdom.

### Exports

- **`class AudioEngine`** — top-level audio controller
- **`interface PadState`** — per-pad metadata: loopId, loopUrl, volume, mute, solo, playbackRate, filterCutoff, loaded, playing
- **`DEFAULT_PAD: PadState`** — factory default values for a blank pad (volume 0.85, filterCutoff 20 000 Hz, everything else off/null)

### Methods (AudioEngine)

- **`constructor(padCount, ctx?)`** — creates AudioContext + EffectsBus + blank padState array
- **`resume()`** — resumes suspended AudioContext (call on first user gesture; required by browser autoplay policy)
- **`getPadState(index)`** — returns a shallow copy of one pad's metadata; throws `RangeError` for out-of-range index
- **`getEffects()`** — returns a copy of current master effects params
- **`loadPad(index, loopId, url)`** — fetches + decodes audio via `loadAudioBuffer`, then calls `loadPadBuffer`
- **`loadPadBuffer(index, loopId, url, buffer)`** — loads a pre-decoded AudioBuffer onto a pad; used by synth samples and recorder preview; `url` may be `null`
- **`unloadPad(index)`** — destroys PadNode, resets pad state to blank
- **`togglePad(index)`** — starts or stops a pad's looping playback
- **`stopAll()`** — stops all playing pads
- **`setPadVolume / setPadMuted / setPadSolo / setPadRate / setPadCutoff`** — individual pad parameter setters; all update state and apply to the live PadNode
- **`setEffects(p)`** — merges partial EffectsParams and forwards to EffectsBus
- **`getMasterRms()`** — reads AnalyserNode for RMS level; called by UI meter in rAF loop
- **`destroy()`** — stops all pads, destroys all PadNodes, destroys EffectsBus, closes AudioContext

### Depends on

- `./effects.js` (EffectsBus, DEFAULT_EFFECTS, EffectsParams)
- `./padNode.js` (PadNode)
- `./buffers.js` (loadAudioBuffer)

---

## apps/web/lib/audio/effects.ts

**Description:** Master effects bus — owns the dry/delay/reverb processing chain wired between the bus input and the AudioContext destination. All parameter mutations use `setTargetAtTime` for click-free ramping; direct `.value` assignment is intentionally avoided. The delay path includes a `delayFilter` (lowpass at 4 kHz) and a feedback loop.

### Exports

- **`class EffectsBus`** — the master audio effects graph
- **`interface EffectsParams`** — masterVolume, delayMs, delayFeedback, delayMix, reverbMix, filterCutoff, filterQ
- **`DEFAULT_EFFECTS: EffectsParams`** — defaults: masterVolume 0.85, delayMs 320, delayFeedback 0.4, delayMix/reverbMix 0.0, filterCutoff 20 000 Hz, filterQ 0.7

### Methods (EffectsBus)

- **`constructor(ctx)`** — creates and wires the full node graph: input → preFilter → [dry, delay, reverb] → master → analyser → destination
- **`setParams(p)`** — applies partial EffectsParams using `setTargetAtTime` on all affected audio params
- **`getRms()`** — reads AnalyserNode time-domain data, returns RMS level (0–1) for metering
- **`destroy()`** — disconnects master and input nodes

### Depends on

- `./impulseResponse.js` (generateImpulseResponse)

---

## apps/web/lib/audio/padNode.ts

**Description:** One pad in the looper grid. Wraps an `AudioBufferSourceNode` + `GainNode` + per-pad lowpass `BiquadFilterNode`. Created and destroyed imperatively by `AudioEngine` — never recreated by React renders. A prepared source is created in the constructor; on `stop()` the source is disconnected and nulled so the next `start()` creates a fresh one (AudioBufferSourceNode is one-shot by spec).

### Exports

- **`class PadNode`** — imperative audio node wrapper
- **`interface PadOptions`** — loop, playbackRate, volume, filterCutoff, destination

### Methods (PadNode)

- **`constructor(ctx, buffer, opts)`** — creates gain + filter nodes, wires to destination, prepares initial source node
- **`start(opts?)`** — starts playback if not already playing; recreates source if nulled after a previous stop
- **`stop()`** — stops and disconnects source node, sets it to null
- **`setRate(rate)`** — smooth playback rate change via `setTargetAtTime` (time constant 0.02 s)
- **`setVolume(volume)`** — smooth gain change via `setTargetAtTime`; respects muted state
- **`setMuted(muted)`** — fades gain to 0 or restores to current volume
- **`setFilterCutoff(hz)`** — smooth filter frequency change via `setTargetAtTime`
- **`isPlaying()`** — returns current playing state
- **`destroy()`** — stops playback, disconnects gain and filter nodes

---

## apps/web/lib/audio/recorder.ts

**Description:** Mic recorder wrapping `getUserMedia` + `MediaRecorder`. State machine: idle → armed → recording → stopping. Emits a `RecordResult` blob on stop. Level monitoring runs in a rAF loop while armed or recording.

### Exports

- **`class LoopRecorderEngine`** — stateful recorder
- **`type RecorderState`** — "idle" | "armed" | "recording" | "stopping"
- **`interface RecordResult`** — blob, durationMs, sampleRate, mimeType
- **`interface RecorderEvents`** — onStateChange, onLevel, onError callbacks

### Methods (LoopRecorderEngine)

- **`arm()`** — calls getUserMedia, creates level-monitoring analyser, transitions to "armed"
- **`start()`** — creates MediaRecorder, begins recording, transitions to "recording"
- **`stop()`** — stops MediaRecorder, returns Promise\<RecordResult\> resolved on onstop
- **`disarm()`** — releases mic stream, transitions to "idle"
- **`getState()`** — returns current RecorderState

---

## apps/web/lib/audio/buffers.ts

**Description:** Audio buffer cache and decode helpers. Caches decoded `AudioBuffer` objects by URL in a module-level Map so loading the same sample twice returns the cached promise without re-fetching.

### Exports

- **`loadAudioBuffer(ctx, url)`** — fetches + decodes audio, caches result by URL
- **`clearAudioCache()`** — empties the URL→Promise\<AudioBuffer\> cache

---

## apps/web/lib/audio/synth.ts

**Description:** Synthesises six tiny `AudioBuffer` objects in-process so the demo ships fully playable samples without any audio files. All samples are loop-friendly with a 5 ms zero-crossing fade-out. Samples: kick (sine sweep), snare (noise+tone), hat (noise tick), bass (saw bassline, C minor), pad (chord), blip (FM blip).

### Exports

- **`renderSynthSample(ctx, id)`** — renders one named sample into an AudioBuffer
- **`SYNTH_SAMPLES: SynthSample[]`** — metadata array: id, name, bpm, durationMs
- **`type SynthSampleId`** — "kick" | "snare" | "hat" | "bass" | "pad" | "blip"
- **`interface SynthSample`** — id, name, bpm, durationMs

---

## apps/web/lib/audio/impulseResponse.ts

**Description:** Generates a synthetic stereo impulse response for the convolver reverb — exponentially decaying noise shaped like a small hall. Avoids shipping a real IR file while still producing a usable reverb effect.

### Exports

- **`generateImpulseResponse(ctx, durationSeconds, decay)`** — returns a stereo AudioBuffer with per-sample `(random * 2 - 1) * (1-t)^decay` envelope

---

## apps/web/lib/audio/__tests__/effects.test.ts

**Description:** Vitest sanity tests for `EffectsParams` defaults — verifies that `DEFAULT_EFFECTS` has the correct shape and values.

### Depends on

- `../effects.js`

<!-- stale: apps/web/lib/audio/CLAUDE.md --> <!-- at: 2026-05-08T05:03:13.123466+00:00 -->


<!-- stale: apps/web/lib/audio/engine.ts --> <!-- at: 2026-05-08T05:07:39.357122+00:00 -->
