export type UserId = string;
export type LoopId = string;
export type SessionId = string;

export interface PublicUser {
  id: UserId;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface LoopMeta {
  id: LoopId;
  ownerId: UserId;
  name: string;
  s3Key: string;
  durationMs: number;
  sampleRate: number;
  bpm: number | null;
  isPublic: boolean;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface PadConfig {
  loopId: LoopId | null;
  volume: number; // 0..1
  mute: boolean;
  solo: boolean;
  playbackRate: number;
  filterCutoff: number; // 20..20000 Hz
}

export interface SessionConfig {
  id: SessionId;
  ownerId: UserId;
  name: string;
  pads: PadConfig[]; // length === PAD_GRID_SIZE
  master: {
    volume: number;
    delayMs: number;
    delayFeedback: number;
    delayMix: number;
    reverbMix: number;
  };
  createdAt: string;
  updatedAt: string;
}
