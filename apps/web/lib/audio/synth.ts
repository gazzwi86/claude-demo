// Synthesises tiny AudioBuffers in-process so the demo has playable
// "bundled samples" without shipping any audio files. The shapes are
// recognisable enough to drop on a pad and loop:
//   - kick: short sine sweep + decay
//   - snare: filtered noise burst
//   - hat: short noise tick
//   - bass: 1-bar saw bassline
//   - pad: 1-bar minor chord
//   - blip: short FM blip
// All loop-friendly (start and end on zero crossings).

export type SynthSampleId = "kick" | "snare" | "hat" | "bass" | "pad" | "blip";

export interface SynthSample {
  id: SynthSampleId;
  name: string;
  bpm: number;
  durationMs: number;
}

export const SYNTH_SAMPLES: SynthSample[] = [
  { id: "kick", name: "Kick · 90 BPM", bpm: 90, durationMs: 666 },
  { id: "snare", name: "Snare · 90 BPM", bpm: 90, durationMs: 666 },
  { id: "hat", name: "Hi-hat · 90 BPM", bpm: 90, durationMs: 333 },
  { id: "bass", name: "Bass · 90 BPM", bpm: 90, durationMs: 2666 },
  { id: "pad", name: "Pad · Cm", bpm: 60, durationMs: 4000 },
  { id: "blip", name: "Blip · 120 BPM", bpm: 120, durationMs: 500 },
];

const TWO_PI = Math.PI * 2;

export function renderSynthSample(ctx: BaseAudioContext, id: SynthSampleId): AudioBuffer {
  const meta = SYNTH_SAMPLES.find((s) => s.id === id)!;
  const sampleRate = ctx.sampleRate;
  const length = Math.floor((meta.durationMs / 1000) * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  switch (id) {
    case "kick":
      renderKick(data, sampleRate);
      break;
    case "snare":
      renderSnare(data, sampleRate);
      break;
    case "hat":
      renderHat(data, sampleRate);
      break;
    case "bass":
      renderBass(data, sampleRate, meta.bpm);
      break;
    case "pad":
      renderPad(data, sampleRate);
      break;
    case "blip":
      renderBlip(data, sampleRate);
      break;
  }

  // Fade the last 5 ms to zero so loop boundaries don't click.
  const fade = Math.min(Math.floor(0.005 * sampleRate), length);
  for (let i = 0; i < fade; i += 1) {
    data[length - 1 - i]! *= i / fade;
  }
  return buffer;
}

function renderKick(data: Float32Array, sampleRate: number): void {
  const length = data.length;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 12);
    const freq = 60 + 100 * Math.exp(-t * 25);
    data[i] = Math.sin(TWO_PI * freq * t) * env * 0.9;
  }
}

function renderSnare(data: Float32Array, sampleRate: number): void {
  const length = data.length;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 18);
    const noise = Math.random() * 2 - 1;
    const tone = Math.sin(TWO_PI * 220 * t) * 0.4;
    data[i] = (noise * 0.7 + tone) * env * 0.7;
  }
}

function renderHat(data: Float32Array, sampleRate: number): void {
  const length = data.length;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 60);
    data[i] = (Math.random() * 2 - 1) * env * 0.5;
  }
}

function renderBass(data: Float32Array, sampleRate: number, bpm: number): void {
  // 4 quarter-notes at the given bpm forming a simple riff in C minor.
  const length = data.length;
  const beatSamples = Math.floor((60 / bpm) * sampleRate);
  // C2, Eb2, G2, F2 (Hz)
  const freqs = [65.41, 77.78, 98.0, 87.31];
  for (let i = 0; i < length; i += 1) {
    const beat = Math.floor(i / beatSamples) % freqs.length;
    const freq = freqs[beat]!;
    const phase = ((i % beatSamples) / beatSamples) * TWO_PI;
    // Saw wave + envelope per beat.
    const tBeat = (i % beatSamples) / sampleRate;
    const env = Math.exp(-tBeat * 6) * 0.6;
    // Simple bandlimited-ish saw via sin sum
    const t = i / sampleRate;
    const saw =
      0.6 * Math.sin(TWO_PI * freq * t + phase) +
      0.3 * Math.sin(TWO_PI * 2 * freq * t) +
      0.15 * Math.sin(TWO_PI * 3 * freq * t);
    data[i] = saw * env * 0.5;
  }
}

function renderPad(data: Float32Array, sampleRate: number): void {
  // Cm chord: C3, Eb3, G3, plus a quiet octave.
  const freqs = [130.81, 155.56, 196.0, 261.63];
  const length = data.length;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const slowLfo = 0.6 + 0.4 * Math.sin(TWO_PI * 0.25 * t);
    let s = 0;
    for (const f of freqs) {
      s += Math.sin(TWO_PI * f * t) / freqs.length;
    }
    // Slow attack + sustain.
    const attack = Math.min(1, t / 0.4);
    data[i] = s * slowLfo * attack * 0.5;
  }
}

function renderBlip(data: Float32Array, sampleRate: number): void {
  const length = data.length;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 10);
    const freq = 880 + 600 * Math.sin(TWO_PI * 6 * t);
    data[i] = Math.sin(TWO_PI * freq * t) * env * 0.5;
  }
}
