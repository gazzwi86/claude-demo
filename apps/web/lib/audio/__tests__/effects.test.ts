import { describe, expect, it } from "vitest";
import { DEFAULT_EFFECTS } from "../effects.js";

describe("DEFAULT_EFFECTS", () => {
  it("is in valid ranges", () => {
    expect(DEFAULT_EFFECTS.masterVolume).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_EFFECTS.masterVolume).toBeLessThanOrEqual(1);
    expect(DEFAULT_EFFECTS.delayMs).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_EFFECTS.delayMs).toBeLessThanOrEqual(2000);
    expect(DEFAULT_EFFECTS.delayFeedback).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_EFFECTS.delayFeedback).toBeLessThan(1);
    expect(DEFAULT_EFFECTS.delayMix).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_EFFECTS.reverbMix).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_EFFECTS.filterCutoff).toBeGreaterThanOrEqual(20);
    expect(DEFAULT_EFFECTS.filterCutoff).toBeLessThanOrEqual(20_000);
  });

  it("starts dry (zero delay/reverb mix) so the user hears their loop unprocessed", () => {
    expect(DEFAULT_EFFECTS.delayMix).toBe(0);
    expect(DEFAULT_EFFECTS.reverbMix).toBe(0);
  });
});
