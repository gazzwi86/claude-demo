"use client";

import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Meter } from "./Meter";
import type { AudioEngine } from "@/lib/audio/engine";
import type { EffectsParams } from "@/lib/audio/effects";

export interface TransportBarProps {
  engine: AudioEngine | null;
  ready: boolean;
  resume: () => Promise<void>;
  effects: EffectsParams;
  onEffects: (p: Partial<EffectsParams>) => void;
  onStopAll: () => void;
}

export function TransportBar({
  engine,
  ready,
  resume,
  effects,
  onEffects,
  onStopAll,
}: TransportBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
      {!ready ? (
        <Button onClick={() => void resume()} aria-label="Enable audio">
          Enable audio
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={onStopAll} aria-label="Stop all pads">
          Stop all
        </Button>
      )}

      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-4 gap-y-2">
        <div className="w-32 shrink-0 sm:w-40">
          <Slider
            label="Master"
            min={0}
            max={1}
            step={0.01}
            value={effects.masterVolume}
            valueDisplay={`${Math.round(effects.masterVolume * 100)}%`}
            onChange={(e) => onEffects({ masterVolume: Number(e.target.value) })}
            aria-label="Master volume"
          />
        </div>
        <div className="shrink-0">
          <Meter engine={engine} />
        </div>
      </div>
    </div>
  );
}
