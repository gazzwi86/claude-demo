// AudioEngine — owns the singleton AudioContext, the master EffectsBus,
// and a Map of PadNodes keyed by pad index. The React layer wraps this
// behind a hook (useAudioEngine), but the engine itself is pure logic
// callable from tests.

import { EffectsBus, DEFAULT_EFFECTS, type EffectsParams } from "./effects.js";
import { PadNode } from "./padNode.js";
import { loadAudioBuffer } from "./buffers.js";

export interface PadState {
  loopId: string | null;
  loopUrl: string | null;
  volume: number;
  mute: boolean;
  solo: boolean;
  playbackRate: number;
  filterCutoff: number;
  loaded: boolean;
  playing: boolean;
}

export const DEFAULT_PAD: PadState = {
  loopId: null,
  loopUrl: null,
  volume: 0.85,
  mute: false,
  solo: false,
  playbackRate: 1,
  filterCutoff: 20_000,
  loaded: false,
  playing: false,
};

export class AudioEngine {
  readonly ctx: AudioContext;
  readonly bus: EffectsBus;

  private readonly pads = new Map<number, PadNode>();
  private padState: PadState[] = [];
  private soloMask = 0;
  private effects: EffectsParams = { ...DEFAULT_EFFECTS };

  constructor(padCount: number, ctx?: AudioContext) {
    this.ctx = ctx ?? new AudioContext({ latencyHint: "interactive" });
    this.bus = new EffectsBus(this.ctx);
    this.padState = Array.from({ length: padCount }, () => ({ ...DEFAULT_PAD }));
  }

  async resume(): Promise<void> {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  getPadState(index: number): PadState {
    const state = this.padState[index];
    if (!state) throw new RangeError(`Pad index ${index} out of range`);
    return { ...state };
  }

  getEffects(): EffectsParams {
    return { ...this.effects };
  }

  async loadPad(index: number, loopId: string, url: string): Promise<void> {
    const buffer = await loadAudioBuffer(this.ctx, url);
    this.loadPadBuffer(index, loopId, url, buffer);
  }

  /**
   * Like loadPad but takes a pre-decoded AudioBuffer (e.g. one rendered by
   * the in-process synth, or the result of a successful upload). Used by
   * the bundled-samples library and by the recorder's "preview" path.
   */
  loadPadBuffer(index: number, loopId: string, url: string | null, buffer: AudioBuffer): void {
    this.unloadPad(index);
    const state = this.padState[index]!;
    const pad = new PadNode(this.ctx, buffer, {
      loop: true,
      playbackRate: state.playbackRate,
      volume: state.mute ? 0 : state.volume,
      filterCutoff: state.filterCutoff,
      destination: this.bus.input,
    });
    this.pads.set(index, pad);
    this.padState[index] = { ...state, loopId, loopUrl: url, loaded: true, playing: false };
  }

  unloadPad(index: number): void {
    const existing = this.pads.get(index);
    if (existing) {
      existing.destroy();
      this.pads.delete(index);
    }
    const state = this.padState[index];
    if (state) {
      this.padState[index] = { ...state, loopId: null, loopUrl: null, loaded: false, playing: false };
    }
  }

  togglePad(index: number): void {
    const pad = this.pads.get(index);
    const state = this.padState[index];
    if (!pad || !state) return;
    if (state.playing) {
      pad.stop();
      this.padState[index] = { ...state, playing: false };
      return;
    }
    pad.start({ loop: true, playbackRate: state.playbackRate });
    this.padState[index] = { ...state, playing: true };
  }

  stopAll(): void {
    for (const [index, pad] of this.pads) {
      pad.stop();
      const state = this.padState[index];
      if (state) this.padState[index] = { ...state, playing: false };
    }
  }

  setPadVolume(index: number, volume: number): void {
    const state = this.padState[index];
    if (!state) return;
    this.padState[index] = { ...state, volume };
    this.pads.get(index)?.setVolume(state.mute ? 0 : volume);
  }

  setPadMuted(index: number, mute: boolean): void {
    const state = this.padState[index];
    if (!state) return;
    this.padState[index] = { ...state, mute };
    this.applyMutes();
  }

  setPadSolo(index: number, solo: boolean): void {
    const state = this.padState[index];
    if (!state) return;
    this.padState[index] = { ...state, solo };
    this.soloMask = this.padState.reduce((acc, s, i) => (s.solo ? acc | (1 << i) : acc), 0);
    this.applyMutes();
  }

  setPadRate(index: number, rate: number): void {
    const state = this.padState[index];
    if (!state) return;
    this.padState[index] = { ...state, playbackRate: rate };
    this.pads.get(index)?.setRate(rate);
  }

  setPadCutoff(index: number, hz: number): void {
    const state = this.padState[index];
    if (!state) return;
    this.padState[index] = { ...state, filterCutoff: hz };
    this.pads.get(index)?.setFilterCutoff(hz);
  }

  setEffects(p: Partial<EffectsParams>): void {
    this.effects = { ...this.effects, ...p };
    this.bus.setParams(p);
  }

  /** RMS of the master analyser. UI meters poll this in rAF. */
  getMasterRms(): number {
    return this.bus.getRms();
  }

  destroy(): void {
    this.stopAll();
    for (const pad of this.pads.values()) pad.destroy();
    this.pads.clear();
    this.bus.destroy();
    if (this.ctx.state !== "closed") {
      this.ctx.close().catch(() => {
        /* already closing */
      });
    }
  }

  private applyMutes(): void {
    const anySolo = this.soloMask !== 0;
    for (let i = 0; i < this.padState.length; i += 1) {
      const state = this.padState[i]!;
      const pad = this.pads.get(i);
      if (!pad) continue;
      const audible = !state.mute && (!anySolo || (this.soloMask & (1 << i)) !== 0);
      pad.setMuted(!audible);
    }
  }
}
