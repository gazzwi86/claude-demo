"use client";

import { useEffect, useRef } from "react";
import type { AudioEngine } from "@/lib/audio/engine";

export interface MeterProps {
  engine: AudioEngine | null;
  label?: string;
}

/** A simple horizontal RMS meter. Reads engine.getMasterRms() in rAF. */
export function Meter({ engine, label = "Master" }: MeterProps) {
  const fillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!engine) return;
    let raf = 0;
    const fill = fillRef.current;
    if (!fill) return;

    const tick = () => {
      const rms = engine.getMasterRms();
      const pct = Math.min(100, Math.round(rms * 200)); // boost a bit; rms is 0..1
      fill.style.width = `${pct}%`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-text-dim)]">
        {label}
      </span>
      <div
        role="meter"
        aria-label={`${label} level`}
        className="h-1.5 w-32 overflow-hidden rounded-full bg-[color:var(--color-border)]"
      >
        <div
          ref={fillRef}
          className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-accent)] via-[color:var(--color-accent)] to-[color:var(--color-warn)] transition-[width] duration-75"
          style={{ width: "0%" }}
        />
      </div>
    </div>
  );
}
