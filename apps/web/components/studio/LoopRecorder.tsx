"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRecorder } from "@/hooks/useRecorder";
import type { AudioEngine } from "@/lib/audio/engine";
import type { RecordResult } from "@/lib/audio/recorder";

export interface LoopRecorderProps {
  engine: AudioEngine | null;
  onRecorded: (result: RecordResult) => void;
}

export function LoopRecorder({ engine, onRecorded }: LoopRecorderProps) {
  const { state, level, arm, start, stop, disarm } = useRecorder(engine);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== "recording") return;
    setElapsed(0);
    const interval = window.setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => window.clearInterval(interval);
  }, [state]);

  async function handleArm() {
    setError(null);
    try {
      await arm();
    } catch (err) {
      setError((err as Error).message ?? "Microphone access denied.");
    }
  }

  async function handleStop() {
    try {
      const result = await stop();
      onRecorded(result);
    } catch (err) {
      setError((err as Error).message ?? "Recording failed.");
    }
  }

  return (
    <section
      aria-label="Loop recorder"
      className="flex flex-wrap items-center gap-4 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"
    >
      <h2 className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-text-dim)]">
        Recorder
      </h2>

      {state === "idle" ? (
        <Button size="sm" variant="secondary" onClick={handleArm}>
          Arm mic
        </Button>
      ) : null}

      {state === "armed" ? (
        <>
          <Button size="sm" onClick={start}>
            ● Record
          </Button>
          <Button size="sm" variant="ghost" onClick={disarm}>
            Cancel
          </Button>
        </>
      ) : null}

      {state === "recording" ? (
        <>
          <Button size="sm" variant="danger" onClick={handleStop}>
            ■ Stop ({elapsed.toFixed(1)}s)
          </Button>
        </>
      ) : null}

      {state === "stopping" ? (
        <span className="text-xs text-[color:var(--color-text-dim)]">Saving…</span>
      ) : null}

      {state === "armed" || state === "recording" ? (
        <div className="ml-2 flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-text-dim)]">
            Mic
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[color:var(--color-border)]">
            <div
              className="h-full bg-[color:var(--color-accent)] transition-[width] duration-75"
              style={{ width: `${Math.min(100, Math.round(level * 200))}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-[color:var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
