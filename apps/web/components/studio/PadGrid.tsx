"use client";

import { Pad } from "./Pad";
import type { AudioEngine, PadState } from "@/lib/audio/engine";
import { PAD_GRID_COLS } from "@looper/shared";

export interface PadGridProps {
  engine: AudioEngine | null;
  pads: PadState[];
  loopNames: Record<number, string>;
  selectedPad: number;
  onSelectPad: (index: number) => void;
  onTogglePad: (index: number) => void;
  onMute: (index: number, m: boolean) => void;
  onSolo: (index: number, s: boolean) => void;
  onVolume: (index: number, v: number) => void;
  onRate: (index: number, r: number) => void;
}

export function PadGrid({
  pads,
  loopNames,
  selectedPad,
  onSelectPad,
  onTogglePad,
  onMute,
  onSolo,
  onVolume,
  onRate,
}: PadGridProps) {
  return (
    <div
      role="grid"
      aria-label="Pad grid"
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${PAD_GRID_COLS}, minmax(0, 1fr))` }}
    >
      {pads.map((state, i) => (
        <Pad
          key={i}
          index={i}
          state={state}
          selected={i === selectedPad}
          onSelect={() => onSelectPad(i)}
          onToggle={() => onTogglePad(i)}
          onMute={(m) => onMute(i, m)}
          onSolo={(s) => onSolo(i, s)}
          onVolume={(v) => onVolume(i, v)}
          onRate={(r) => onRate(i, r)}
          loopName={loopNames[i]}
        />
      ))}
    </div>
  );
}
