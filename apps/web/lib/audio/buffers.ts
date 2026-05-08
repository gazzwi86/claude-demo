// Audio buffer cache + decode helpers.
// Caches by URL so that loading the same sample twice doesn't re-decode.

const cache = new Map<string, Promise<AudioBuffer>>();

export async function loadAudioBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const cached = cache.get(url);
  if (cached) return cached;

  const promise = (async () => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(`Failed to load audio at ${url}: ${res.status} ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return ctx.decodeAudioData(arrayBuffer);
  })();

  cache.set(url, promise);
  promise.catch(() => cache.delete(url));
  return promise;
}

export function clearAudioCache(): void {
  cache.clear();
}
