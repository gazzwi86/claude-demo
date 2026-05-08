// Placeholder studio page — will be replaced with the full TransportBar +
// PadGrid + EffectsRack + LoopRecorder layout in Phase 6.
"use client";

import { Button } from "@/components/ui/Button";
import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function StudioPage() {
  const { ready, resume } = useAudioEngine();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Studio</h1>
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 text-center">
        {!ready ? (
          <>
            <p className="mb-4 text-sm text-[color:var(--color-text-dim)]">
              The browser needs a click to start audio.
            </p>
            <Button onClick={() => void resume()}>Enable audio</Button>
          </>
        ) : (
          <p className="text-sm text-[color:var(--color-text-dim)]">
            Audio engine ready. Pad grid + effects rack land in the next pass.
          </p>
        )}
      </div>
    </main>
  );
}
