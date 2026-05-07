export const PAD_GRID_ROWS = 4;
export const PAD_GRID_COLS = 4;
export const PAD_GRID_SIZE = PAD_GRID_ROWS * PAD_GRID_COLS;

export const MIN_PLAYBACK_RATE = 0.25;
export const MAX_PLAYBACK_RATE = 4.0;
export const DEFAULT_PLAYBACK_RATE = 1.0;

export const MAX_LOOP_DURATION_MS = 30_000;
export const MAX_LOOP_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_LOOP_MIMES = ["audio/webm", "audio/ogg", "audio/wav", "audio/mpeg"] as const;
export type AllowedLoopMime = (typeof ALLOWED_LOOP_MIMES)[number];
