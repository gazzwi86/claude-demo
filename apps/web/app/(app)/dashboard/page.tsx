"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiClient, ApiError } from "@/lib/api-client";
import type { LoopMeta } from "@looper/shared";

export default function DashboardPage() {
  const [loops, setLoops] = useState<LoopMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ loops: LoopMeta[] }>("/loops")
      .then((data) => {
        if (!cancelled) setLoops(data.loops);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login";
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load loops.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function deleteLoop(id: string) {
    if (!confirm("Delete this loop?")) return;
    try {
      await apiClient.delete(`/loops/${encodeURIComponent(id)}`);
      setLoops((prev) => prev?.filter((l) => l.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your loops</h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-dim)]">
            Recordings and saved sessions live here.
          </p>
        </div>
        <Link
          href="/studio"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[color:var(--color-accent)] px-4 text-sm font-semibold text-black hover:bg-[color:var(--color-accent-dim)]"
        >
          Open studio
        </Link>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-md bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
          {error}
        </p>
      ) : null}

      {loops === null ? (
        <p className="text-sm text-[color:var(--color-text-dim)]">Loading…</p>
      ) : loops.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)]/40 p-12 text-center">
          <p className="text-sm text-[color:var(--color-text-dim)]">
            No loops yet — head to the studio to record one.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--color-border)] rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
          {loops.map((loop) => (
            <li key={loop.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{loop.name}</p>
                <p className="text-xs text-[color:var(--color-text-dim)]">
                  {Math.round(loop.durationMs / 100) / 10}s · {(loop.sizeBytes / 1024).toFixed(1)} kB
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteLoop(loop.id)} aria-label={`Delete ${loop.name}`}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
