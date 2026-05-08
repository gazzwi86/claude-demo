"use client";

import { useEffect, useRef, useState } from "react";
import { AudioEngine } from "@/lib/audio/engine";
import { PAD_GRID_SIZE } from "@looper/shared";

export interface UseAudioEngineResult {
  engine: AudioEngine | null;
  ready: boolean;
  resume: () => Promise<void>;
}

/**
 * Singleton-per-page hook that owns the AudioContext.
 *
 * The engine is lazily constructed on first call to `resume()` (browsers
 * require a user gesture). Once created it lives for the page lifetime.
 */
export function useAudioEngine(): UseAudioEngineResult {
  const ref = useRef<AudioEngine | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(
    () => () => {
      ref.current?.destroy();
      ref.current = null;
    },
    [],
  );

  const resume = async () => {
    if (!ref.current) {
      ref.current = new AudioEngine(PAD_GRID_SIZE);
    }
    await ref.current.resume();
    setReady(true);
  };

  return { engine: ref.current, ready, resume };
}
