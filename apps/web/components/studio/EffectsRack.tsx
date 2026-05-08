"use client";

import { Slider } from "@/components/ui/Slider";
import type { EffectsParams } from "@/lib/audio/effects";

export interface EffectsRackProps {
  effects: EffectsParams;
  onChange: (p: Partial<EffectsParams>) => void;
}

export function EffectsRack({ effects, onChange }: EffectsRackProps) {
  return (
    <section
      aria-label="Effects rack"
      className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
    >
      <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-text-dim)]">
        Effects
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-3">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[color:var(--color-text)]">Filter</h3>
          <Slider
            label="Cutoff"
            min={20}
            max={20_000}
            step={10}
            value={effects.filterCutoff}
            valueDisplay={`${Math.round(effects.filterCutoff)} Hz`}
            onChange={(e) => onChange({ filterCutoff: Number(e.target.value) })}
            aria-label="Filter cutoff"
          />
          <Slider
            label="Resonance"
            min={0.1}
            max={18}
            step={0.1}
            value={effects.filterQ}
            valueDisplay={effects.filterQ.toFixed(1)}
            onChange={(e) => onChange({ filterQ: Number(e.target.value) })}
            aria-label="Filter Q"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[color:var(--color-text)]">Delay</h3>
          <Slider
            label="Time"
            min={0}
            max={2000}
            step={1}
            value={effects.delayMs}
            valueDisplay={`${effects.delayMs} ms`}
            onChange={(e) => onChange({ delayMs: Number(e.target.value) })}
            aria-label="Delay time"
          />
          <Slider
            label="Feedback"
            min={0}
            max={0.95}
            step={0.01}
            value={effects.delayFeedback}
            valueDisplay={`${Math.round(effects.delayFeedback * 100)}%`}
            onChange={(e) => onChange({ delayFeedback: Number(e.target.value) })}
            aria-label="Delay feedback"
          />
          <Slider
            label="Mix"
            min={0}
            max={1}
            step={0.01}
            value={effects.delayMix}
            valueDisplay={`${Math.round(effects.delayMix * 100)}%`}
            onChange={(e) => onChange({ delayMix: Number(e.target.value) })}
            aria-label="Delay mix"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[color:var(--color-text)]">Reverb</h3>
          <Slider
            label="Mix"
            min={0}
            max={1}
            step={0.01}
            value={effects.reverbMix}
            valueDisplay={`${Math.round(effects.reverbMix * 100)}%`}
            onChange={(e) => onChange({ reverbMix: Number(e.target.value) })}
            aria-label="Reverb mix"
          />
        </div>
      </div>
    </section>
  );
}
