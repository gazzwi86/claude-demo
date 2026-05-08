"use client";

import { Button } from "@/components/ui/Button";

export interface SampleEntry {
  id: string;
  name: string;
  url: string;
  durationMs?: number;
  bpm?: number | null;
  source: "bundled" | "user";
}

export interface LibraryDrawerProps {
  selectedPad: number;
  samples: SampleEntry[];
  loadingSamples: boolean;
  onLoad: (entry: SampleEntry) => void;
  onUnload: () => void;
}

export function LibraryDrawer({
  selectedPad,
  samples,
  loadingSamples,
  onLoad,
  onUnload,
}: LibraryDrawerProps) {
  const bundled = samples.filter((s) => s.source === "bundled");
  const userOwned = samples.filter((s) => s.source === "user");

  return (
    <aside
      aria-label="Sample library"
      className="flex flex-col gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-text-dim)]">
          Library
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-text-dim)]">
          → Pad {String(selectedPad + 1).padStart(2, "0")}
        </span>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-[color:var(--color-text)]">
          Bundled samples
        </h3>
        {loadingSamples ? (
          <p className="text-xs text-[color:var(--color-text-dim)]">Loading…</p>
        ) : bundled.length === 0 ? (
          <p className="text-xs text-[color:var(--color-text-dim)]">No bundled samples yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {bundled.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onLoad(s)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-[color:var(--color-surface-2)]"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="font-mono text-[10px] text-[color:var(--color-text-dim)]">
                    load
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {userOwned.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold text-[color:var(--color-text)]">
            Your loops
          </h3>
          <ul className="flex flex-col gap-1">
            {userOwned.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onLoad(s)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-[color:var(--color-surface-2)]"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="font-mono text-[10px] text-[color:var(--color-text-dim)]">
                    load
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button variant="ghost" size="sm" onClick={onUnload} className="self-start">
        Clear pad
      </Button>
    </aside>
  );
}
