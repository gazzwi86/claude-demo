"use client";

import { clsx } from "clsx";
import { Slider } from "@/components/ui/Slider";
import type { PadState } from "@/lib/audio/engine";

export interface PadProps {
  index: number;
  state: PadState;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onMute: (m: boolean) => void;
  onSolo: (s: boolean) => void;
  onVolume: (v: number) => void;
  onRate: (r: number) => void;
  loopName?: string;
}

export function Pad({
  index,
  state,
  selected,
  onSelect,
  onToggle,
  onMute,
  onSolo,
  onVolume,
  onRate,
  loopName,
}: PadProps) {
  const empty = !state.loaded;
  return (
    <div
      onClick={onSelect}
      className={clsx(
        "group relative flex flex-col rounded-lg border p-3 transition",
        "cursor-pointer",
        empty
          ? "border-dashed border-[color:var(--color-border)] bg-transparent text-[color:var(--color-text-dim)]"
          : state.playing
            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 shadow-[0_0_0_1px_var(--color-accent)]"
            : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-text-dim)]",
        selected && !empty && "ring-1 ring-[color:var(--color-accent)]",
      )}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-text-dim)]">
          Pad {String(index + 1).padStart(2, "0")}
        </span>
        {!empty ? (
          <div className="flex gap-1 text-[10px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMute(!state.mute);
              }}
              aria-pressed={state.mute}
              aria-label={`${state.mute ? "Unmute" : "Mute"} pad ${index + 1}`}
              className={clsx(
                "rounded px-1.5 font-bold uppercase",
                state.mute
                  ? "bg-[color:var(--color-warn)] text-black"
                  : "bg-[color:var(--color-border)] text-[color:var(--color-text-dim)]",
              )}
            >
              M
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSolo(!state.solo);
              }}
              aria-pressed={state.solo}
              aria-label={`${state.solo ? "Unsolo" : "Solo"} pad ${index + 1}`}
              className={clsx(
                "rounded px-1.5 font-bold uppercase",
                state.solo
                  ? "bg-[color:var(--color-accent)] text-black"
                  : "bg-[color:var(--color-border)] text-[color:var(--color-text-dim)]",
              )}
            >
              S
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (empty) {
            onSelect();
            return;
          }
          onToggle();
        }}
        aria-label={empty ? `Pad ${index + 1} empty — open library` : state.playing ? `Stop pad ${index + 1}` : `Play pad ${index + 1}`}
        className={clsx(
          "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-3",
          empty
            ? "text-[color:var(--color-text-dim)]/50"
            : state.playing
              ? "bg-[color:var(--color-accent)] text-black"
              : "bg-[color:var(--color-surface-2)] text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)]",
        )}
      >
        {empty ? (
          <span className="text-xs">+ load</span>
        ) : (
          <>
            <span className="text-2xl leading-none">{state.playing ? "■" : "▶"}</span>
            <span className="line-clamp-1 px-1 text-[10px] uppercase tracking-wider">
              {loopName ?? "Untitled"}
            </span>
          </>
        )}
      </button>

      {!empty ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Slider
            label="Vol"
            min={0}
            max={1}
            step={0.01}
            value={state.volume}
            valueDisplay={`${Math.round(state.volume * 100)}`}
            onChange={(e) => onVolume(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Pad ${index + 1} volume`}
          />
          <Slider
            label="Rate"
            min={0.25}
            max={2}
            step={0.01}
            value={state.playbackRate}
            valueDisplay={`${state.playbackRate.toFixed(2)}×`}
            onChange={(e) => onRate(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Pad ${index + 1} playback rate`}
          />
        </div>
      ) : null}
    </div>
  );
}
