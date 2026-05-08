"use client";

import { useCallback, useEffect, useState } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { TransportBar } from "@/components/studio/TransportBar";
import { PadGrid } from "@/components/studio/PadGrid";
import { EffectsRack } from "@/components/studio/EffectsRack";
import { LoopRecorder } from "@/components/studio/LoopRecorder";
import { LibraryDrawer, type SampleEntry } from "@/components/studio/LibraryDrawer";
import { Button } from "@/components/ui/Button";
import { renderSynthSample, SYNTH_SAMPLES } from "@/lib/audio/synth";
import { DEFAULT_EFFECTS, type EffectsParams } from "@/lib/audio/effects";
import { DEFAULT_PAD, type PadState } from "@/lib/audio/engine";
import { PAD_GRID_SIZE } from "@looper/shared";
import type { RecordResult } from "@/lib/audio/recorder";

declare global {
  interface Window {
    __looperDebug?: {
      getMasterRms: () => number;
      getPad: (i: number) => PadState;
      getEffects: () => EffectsParams;
    };
  }
}

const initialPads = (): PadState[] => Array.from({ length: PAD_GRID_SIZE }, () => ({ ...DEFAULT_PAD }));

export default function StudioPage() {
  const { engine, ready, resume } = useAudioEngine();
  const [pads, setPads] = useState<PadState[]>(initialPads);
  const [loopNames, setLoopNames] = useState<Record<number, string>>({});
  const [selectedPad, setSelectedPad] = useState(0);
  const [effects, setEffects] = useState<EffectsParams>({ ...DEFAULT_EFFECTS });
  const [samples, setSamples] = useState<SampleEntry[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);

  // Build the bundled-samples list once the engine is ready (we render
  // them in-process via the Web Audio API; no network required).
  useEffect(() => {
    if (!ready || !engine) return;
    setLoadingSamples(true);
    const entries: SampleEntry[] = SYNTH_SAMPLES.map((s) => ({
      id: `synth:${s.id}`,
      name: s.name,
      url: `synth:${s.id}`,
      durationMs: s.durationMs,
      bpm: s.bpm,
      source: "bundled" as const,
    }));
    setSamples(entries);
    setLoadingSamples(false);
  }, [ready, engine]);

  // Expose minimal hooks for E2E tests to introspect engine state without
  // leaking implementation details.
  useEffect(() => {
    if (!engine) return;
    window.__looperDebug = {
      getMasterRms: () => engine.getMasterRms(),
      getPad: (i: number) => engine.getPadState(i),
      getEffects: () => engine.getEffects(),
    };
    return () => {
      delete window.__looperDebug;
    };
  }, [engine]);

  const refreshPad = useCallback(
    (index: number) => {
      if (!engine) return;
      const next = engine.getPadState(index);
      setPads((prev) => prev.map((p, i) => (i === index ? next : p)));
    },
    [engine],
  );

  const loadSampleOnto = useCallback(
    async (index: number, entry: SampleEntry) => {
      if (!engine) return;
      if (entry.url.startsWith("synth:")) {
        const id = entry.url.slice("synth:".length);
        const buffer = renderSynthSample(engine.ctx, id as Parameters<typeof renderSynthSample>[1]);
        engine.loadPadBuffer(index, entry.id, null, buffer);
      } else {
        await engine.loadPad(index, entry.id, entry.url);
      }
      setLoopNames((prev) => ({ ...prev, [index]: entry.name }));
      refreshPad(index);
    },
    [engine, refreshPad],
  );

  const onRecorded = useCallback(
    async (result: RecordResult) => {
      if (!engine) return;
      const buffer = await engine.ctx.decodeAudioData(await result.blob.arrayBuffer());
      const id = `recording-${Date.now()}`;
      engine.loadPadBuffer(selectedPad, id, null, buffer);
      const name = `Recording (${(result.durationMs / 1000).toFixed(1)}s)`;
      setLoopNames((prev) => ({ ...prev, [selectedPad]: name }));
      refreshPad(selectedPad);
      setSamples((prev) => [
        ...prev,
        {
          id,
          name,
          url: id,
          durationMs: result.durationMs,
          source: "user" as const,
        },
      ]);
    },
    [engine, selectedPad, refreshPad],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6">
      <h1 className="sr-only">Studio</h1>

      {!ready ? (
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-12 text-center">
          <h2 className="mb-2 text-lg font-semibold">Ready when you are</h2>
          <p className="mb-5 text-sm text-[color:var(--color-text-dim)]">
            The browser needs a click before it can play sound.
          </p>
          <Button onClick={() => void resume()} aria-label="Start studio">
            Start studio
          </Button>
        </div>
      ) : (
        <>
          <TransportBar
            engine={engine}
            ready={ready}
            resume={resume}
            effects={effects}
            onEffects={(p) => {
              setEffects((prev) => ({ ...prev, ...p }));
              engine?.setEffects(p);
            }}
            onStopAll={() => {
              engine?.stopAll();
              setPads((prev) => prev.map((p) => ({ ...p, playing: false })));
            }}
          />

          <LoopRecorder engine={engine} onRecorded={onRecorded} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <PadGrid
              engine={engine}
              pads={pads}
              loopNames={loopNames}
              selectedPad={selectedPad}
              onSelectPad={setSelectedPad}
              onTogglePad={(i) => {
                engine?.togglePad(i);
                refreshPad(i);
              }}
              onMute={(i, m) => {
                engine?.setPadMuted(i, m);
                refreshPad(i);
              }}
              onSolo={(i, s) => {
                engine?.setPadSolo(i, s);
                pads.forEach((_, idx) => refreshPad(idx));
              }}
              onVolume={(i, v) => {
                engine?.setPadVolume(i, v);
                refreshPad(i);
              }}
              onRate={(i, r) => {
                engine?.setPadRate(i, r);
                refreshPad(i);
              }}
            />
            <LibraryDrawer
              selectedPad={selectedPad}
              samples={samples}
              loadingSamples={loadingSamples}
              onLoad={(s) => void loadSampleOnto(selectedPad, s)}
              onUnload={() => {
                engine?.unloadPad(selectedPad);
                setLoopNames((prev) => {
                  const next = { ...prev };
                  delete next[selectedPad];
                  return next;
                });
                refreshPad(selectedPad);
              }}
            />
          </div>

          <EffectsRack
            effects={effects}
            onChange={(p) => {
              setEffects((prev) => ({ ...prev, ...p }));
              engine?.setEffects(p);
            }}
          />
        </>
      )}
    </main>
  );
}
