"use client";

import { useCallback, useState } from "react";
import type { AudioEngine, PadState } from "@/lib/audio/engine";
import { DEFAULT_PAD } from "@/lib/audio/engine";

export interface UsePadResult {
  state: PadState;
  load: (loopId: string, url: string) => Promise<void>;
  unload: () => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  setSolo: (s: boolean) => void;
  setRate: (r: number) => void;
  setCutoff: (hz: number) => void;
}

/**
 * One pad slot. State mirror is intentional — react needs renders for UI;
 * the engine owns the actual audio nodes. Mutations write to both.
 */
export function usePad(engine: AudioEngine | null, index: number): UsePadResult {
  const [state, setState] = useState<PadState>(() => ({ ...DEFAULT_PAD }));

  const refresh = useCallback(() => {
    if (engine) setState(engine.getPadState(index));
  }, [engine, index]);

  const load = useCallback(
    async (loopId: string, url: string) => {
      if (!engine) return;
      await engine.loadPad(index, loopId, url);
      refresh();
    },
    [engine, index, refresh],
  );

  const unload = useCallback(() => {
    engine?.unloadPad(index);
    refresh();
  }, [engine, index, refresh]);

  const toggle = useCallback(() => {
    engine?.togglePad(index);
    refresh();
  }, [engine, index, refresh]);

  const setVolume = useCallback(
    (v: number) => {
      engine?.setPadVolume(index, v);
      refresh();
    },
    [engine, index, refresh],
  );

  const setMuted = useCallback(
    (m: boolean) => {
      engine?.setPadMuted(index, m);
      refresh();
    },
    [engine, index, refresh],
  );

  const setSolo = useCallback(
    (s: boolean) => {
      engine?.setPadSolo(index, s);
      refresh();
    },
    [engine, index, refresh],
  );

  const setRate = useCallback(
    (r: number) => {
      engine?.setPadRate(index, r);
      refresh();
    },
    [engine, index, refresh],
  );

  const setCutoff = useCallback(
    (hz: number) => {
      engine?.setPadCutoff(index, hz);
      refresh();
    },
    [engine, index, refresh],
  );

  return { state, load, unload, toggle, setVolume, setMuted, setSolo, setRate, setCutoff };
}
