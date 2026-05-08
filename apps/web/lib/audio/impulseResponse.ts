// Synthetic impulse response for the convolver reverb. Avoids shipping a real
// IR sample. The shape is exponentially decaying noise — sounds like a small
// hall. Mono in, generates a stereo IR.

export function generateImpulseResponse(
  ctx: BaseAudioContext,
  durationSeconds: number,
  decay: number,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return buffer;
}
