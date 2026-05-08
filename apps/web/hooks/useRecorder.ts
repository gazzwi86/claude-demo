"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoopRecorderEngine, type RecorderState, type RecordResult } from "@/lib/audio/recorder";
import type { AudioEngine } from "@/lib/audio/engine";

export interface UseRecorderResult {
  state: RecorderState;
  level: number;
  arm: () => Promise<void>;
  start: () => void;
  stop: () => Promise<RecordResult>;
  disarm: () => void;
}

export function useRecorder(engine: AudioEngine | null): UseRecorderResult {
  const ref = useRef<LoopRecorderEngine | null>(null);
  const [state, setState] = useState<RecorderState>("idle");
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!engine || ref.current) return;
    ref.current = new LoopRecorderEngine(engine.ctx, {
      onStateChange: setState,
      onLevel: setLevel,
    });
    return () => {
      ref.current?.disarm();
      ref.current = null;
    };
  }, [engine]);

  const arm = useCallback(async () => {
    if (!ref.current) throw new Error("AudioEngine not ready");
    await ref.current.arm();
  }, []);

  const start = useCallback(() => {
    ref.current?.start();
  }, []);

  const stop = useCallback(() => {
    if (!ref.current) return Promise.reject(new Error("AudioEngine not ready"));
    return ref.current.stop();
  }, []);

  const disarm = useCallback(() => {
    ref.current?.disarm();
  }, []);

  return { state, level, arm, start, stop, disarm };
}
