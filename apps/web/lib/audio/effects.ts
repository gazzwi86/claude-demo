// Master effects bus. Owns the dry/delay/reverb network behind the master gain.
// Exposes setters for the params surfaced by the EffectsRack UI.

import { generateImpulseResponse } from "./impulseResponse.js";

export interface EffectsParams {
  masterVolume: number; // 0..1
  delayMs: number; // 0..2000
  delayFeedback: number; // 0..0.95
  delayMix: number; // 0..1
  reverbMix: number; // 0..1
  filterCutoff: number; // 20..20000 Hz, master pre-bus filter
  filterQ: number; // 0.1..18
}

export const DEFAULT_EFFECTS: EffectsParams = {
  masterVolume: 0.85,
  delayMs: 320,
  delayFeedback: 0.4,
  delayMix: 0.0,
  reverbMix: 0.0,
  filterCutoff: 20_000,
  filterQ: 0.7,
};

export class EffectsBus {
  readonly input: GainNode;

  private readonly ctx: AudioContext;
  private readonly preFilter: BiquadFilterNode;
  private readonly dry: GainNode;
  private readonly delay: DelayNode;
  private readonly delayFeedback: GainNode;
  private readonly delayMix: GainNode;
  private readonly delayFilter: BiquadFilterNode;
  private readonly reverb: ConvolverNode;
  private readonly reverbMix: GainNode;
  private readonly master: GainNode;
  private readonly analyser: AnalyserNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    this.input = ctx.createGain();
    this.input.gain.value = 1;

    this.preFilter = ctx.createBiquadFilter();
    this.preFilter.type = "lowpass";
    this.preFilter.frequency.value = DEFAULT_EFFECTS.filterCutoff;
    this.preFilter.Q.value = DEFAULT_EFFECTS.filterQ;

    this.dry = ctx.createGain();
    this.dry.gain.value = 1;

    this.delay = ctx.createDelay(2.0);
    this.delay.delayTime.value = DEFAULT_EFFECTS.delayMs / 1000;
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.value = DEFAULT_EFFECTS.delayFeedback;
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = "lowpass";
    this.delayFilter.frequency.value = 4000;
    this.delayMix = ctx.createGain();
    this.delayMix.gain.value = DEFAULT_EFFECTS.delayMix;

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = generateImpulseResponse(ctx, 2.4, 2.0);
    this.reverbMix = ctx.createGain();
    this.reverbMix.gain.value = DEFAULT_EFFECTS.reverbMix;

    this.master = ctx.createGain();
    this.master.gain.value = DEFAULT_EFFECTS.masterVolume;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.8;

    // Wire: input -> preFilter -> [dry, delay, reverb] -> master -> analyser -> destination.
    this.input.connect(this.preFilter);
    this.preFilter.connect(this.dry);
    this.preFilter.connect(this.delay);
    this.preFilter.connect(this.reverb);

    this.delay.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);
    this.delayFilter.connect(this.delayMix);

    this.dry.connect(this.master);
    this.delayMix.connect(this.master);
    this.reverb.connect(this.reverbMix);
    this.reverbMix.connect(this.master);

    this.master.connect(this.analyser);
    this.analyser.connect(ctx.destination);
  }

  setParams(p: Partial<EffectsParams>): void {
    const t = this.ctx.currentTime;
    if (p.masterVolume !== undefined) this.master.gain.setTargetAtTime(p.masterVolume, t, 0.02);
    if (p.delayMs !== undefined) this.delay.delayTime.setTargetAtTime(p.delayMs / 1000, t, 0.05);
    if (p.delayFeedback !== undefined)
      this.delayFeedback.gain.setTargetAtTime(p.delayFeedback, t, 0.02);
    if (p.delayMix !== undefined) this.delayMix.gain.setTargetAtTime(p.delayMix, t, 0.02);
    if (p.reverbMix !== undefined) this.reverbMix.gain.setTargetAtTime(p.reverbMix, t, 0.02);
    if (p.filterCutoff !== undefined)
      this.preFilter.frequency.setTargetAtTime(p.filterCutoff, t, 0.02);
    if (p.filterQ !== undefined) this.preFilter.Q.setTargetAtTime(p.filterQ, t, 0.02);
  }

  getRms(): number {
    const buf = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i += 1) {
      const sample = (buf[i]! - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / buf.length);
  }

  destroy(): void {
    try {
      this.master.disconnect();
      this.input.disconnect();
    } catch {
      /* node already disconnected */
    }
  }
}
