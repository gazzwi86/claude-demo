// Mic recorder. Wraps `getUserMedia` + `MediaRecorder`.
// Emits a Blob (webm/opus by default) on stop.

export type RecorderState = "idle" | "armed" | "recording" | "stopping";

export interface RecorderEvents {
  onStateChange?: (state: RecorderState) => void;
  onLevel?: (rms: number) => void;
  onError?: (err: Error) => void;
}

export interface RecordResult {
  blob: Blob;
  durationMs: number;
  sampleRate: number;
  mimeType: string;
}

const PREFERRED_MIMES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  for (const mime of PREFERRED_MIMES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "audio/webm";
}

export class LoopRecorderEngine {
  private state: RecorderState = "idle";
  private stream: MediaStream | null = null;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private analyser: AnalyserNode | null = null;
  private rafId = 0;
  private pendingResolve: ((value: RecordResult) => void) | null = null;
  private pendingReject: ((err: Error) => void) | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly events: RecorderEvents = {},
  ) {}

  private setState(next: RecorderState): void {
    this.state = next;
    this.events.onStateChange?.(next);
  }

  getState(): RecorderState {
    return this.state;
  }

  async arm(): Promise<void> {
    if (this.state !== "idle") return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      const source = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);
      this.startLevelLoop();
      this.setState("armed");
    } catch (err) {
      this.events.onError?.(err as Error);
      this.disarm();
      throw err;
    }
  }

  start(): void {
    if (this.state !== "armed" || !this.stream) {
      throw new Error("Recorder not armed");
    }
    const mimeType = pickMime();
    this.rec = new MediaRecorder(this.stream, { mimeType });
    this.chunks = [];
    this.rec.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.rec.onerror = (event) => {
      const err = new Error(`MediaRecorder error: ${(event as Event).type}`);
      this.events.onError?.(err);
      this.pendingReject?.(err);
      this.cleanup();
    };
    this.rec.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.rec?.mimeType ?? mimeType });
      const durationMs = performance.now() - this.startedAt;
      this.pendingResolve?.({
        blob,
        durationMs,
        sampleRate: this.ctx.sampleRate,
        mimeType: this.rec?.mimeType ?? mimeType,
      });
      this.cleanup();
    };
    this.rec.start();
    this.startedAt = performance.now();
    this.setState("recording");
  }

  stop(): Promise<RecordResult> {
    if (this.state !== "recording") {
      return Promise.reject(new Error(`Cannot stop in state ${this.state}`));
    }
    this.setState("stopping");
    return new Promise<RecordResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
      this.rec?.stop();
    });
  }

  disarm(): void {
    this.cleanup();
    this.setState("idle");
  }

  private cleanup(): void {
    cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.rec = null;
    this.analyser?.disconnect();
    this.analyser = null;
    this.chunks = [];
    this.pendingResolve = null;
    this.pendingReject = null;
  }

  private startLevelLoop(): void {
    if (!this.analyser) return;
    const buf = new Uint8Array(this.analyser.fftSize);
    const tick = () => {
      if (!this.analyser) return;
      this.analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i += 1) {
        const v = (buf[i]! - 128) / 128;
        sum += v * v;
      }
      this.events.onLevel?.(Math.sqrt(sum / buf.length));
      this.rafId = requestAnimationFrame(tick);
    };
    tick();
  }
}
