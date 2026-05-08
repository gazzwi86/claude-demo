# Audio Engine — `apps/web/lib/audio/`

`AudioEngine` owns the single `AudioContext` for the page. Never call `new AudioContext()` anywhere else — it is a singleton instantiated once in `useAudioEngine`. Call `engine.resume()` on the first user gesture to satisfy the browser autoplay policy; the context starts suspended.

Audio handles (`PadNode`, `EffectsBus`) are imperative refs, not React state. Re-renders must not recreate `AudioBufferSourceNode`s — doing so causes audible glitches and broken loops. Pad metadata (volume, mute, loop ID) lives in React state via `PadState`; the underlying nodes are managed exclusively by `AudioEngine`.

`PadNode` (`padNode.ts`) wraps `AudioBufferSourceNode → GainNode → BiquadFilterNode (lowpass)`, then connects to `EffectsBus.input`. Use `setTargetAtTime` — never direct `.value` assignment — for all gain/param changes to avoid zipper noise.

`EffectsBus` (`effects.ts`) is the master chain: `input → preFilter (lowpass) → [dry | delay feedback loop | reverb convolver] → master GainNode → AnalyserNode → destination`. All three wet paths are parallel sends from `preFilter`. Mix levels are controlled via `delayMix` and `reverbMix` gain nodes, also updated with `setTargetAtTime`.

Loop boundary zero-fades: `src.loop = true` is set on the `AudioBufferSourceNode`; no manual crossfade is applied — the browser handles the loop point. If adding manual scheduling, fade the gain node around the loop boundary to prevent clicks.

`AudioEngine.destroy()` stops all pads, disconnects the bus, and closes the context. Always call it in the `useAudioEngine` hook cleanup.
