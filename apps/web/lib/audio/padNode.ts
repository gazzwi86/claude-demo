// One pad in the grid. Wraps an AudioBufferSourceNode + Gain + per-pad
// lowpass insert. Designed to be created/destroyed imperatively by the
// audio engine — never recreated by React renders.

export interface PadOptions {
  loop?: boolean;
  playbackRate?: number;
  volume?: number;
  filterCutoff?: number;
  destination: AudioNode;
}

export class PadNode {
  private readonly ctx: AudioContext;
  private readonly buffer: AudioBuffer;
  private readonly gain: GainNode;
  private readonly filter: BiquadFilterNode;
  private source: AudioBufferSourceNode | null = null;
  private playing = false;
  private muted = false;
  private currentVolume: number;

  constructor(ctx: AudioContext, buffer: AudioBuffer, opts: PadOptions) {
    this.ctx = ctx;
    this.buffer = buffer;

    this.currentVolume = opts.volume ?? 0.85;
    this.gain = ctx.createGain();
    this.gain.gain.value = this.currentVolume;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = opts.filterCutoff ?? 20_000;
    this.filter.Q.value = 0.7;

    this.gain.connect(this.filter);
    this.filter.connect(opts.destination);

    this.preparedSource(opts);
  }

  private preparedSource(opts: PadOptions): AudioBufferSourceNode {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.loop = opts.loop ?? true;
    src.playbackRate.value = opts.playbackRate ?? 1;
    src.connect(this.gain);
    this.source = src;
    return src;
  }

  start(opts?: { playbackRate?: number; loop?: boolean; offset?: number }): void {
    if (this.playing) return;
    if (!this.source) {
      this.preparedSource({
        loop: opts?.loop ?? true,
        playbackRate: opts?.playbackRate ?? 1,
        destination: this.filter,
      });
    }
    if (opts?.playbackRate !== undefined) this.source!.playbackRate.value = opts.playbackRate;
    if (opts?.loop !== undefined) this.source!.loop = opts.loop;
    this.source!.start(0, opts?.offset ?? 0);
    this.playing = true;
  }

  stop(): void {
    if (!this.playing) return;
    try {
      this.source?.stop();
    } catch {
      /* already stopped */
    }
    this.source?.disconnect();
    this.source = null;
    this.playing = false;
  }

  setRate(rate: number): void {
    if (this.source) {
      this.source.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.02);
    }
  }

  setVolume(volume: number): void {
    this.currentVolume = volume;
    if (!this.muted) {
      this.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.01);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.gain.gain.setTargetAtTime(muted ? 0 : this.currentVolume, this.ctx.currentTime, 0.01);
  }

  setFilterCutoff(hz: number): void {
    this.filter.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.02);
  }

  isPlaying(): boolean {
    return this.playing;
  }

  destroy(): void {
    this.stop();
    try {
      this.gain.disconnect();
      this.filter.disconnect();
    } catch {
      /* already disconnected */
    }
  }
}
