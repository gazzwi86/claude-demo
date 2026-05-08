// Behavioural smoke for the /studio page — exercises the actual Web
// Audio engine end-to-end without a running api. Bundled samples are
// rendered in-process (lib/audio/synth.ts), so loading them onto pads
// and playing back is fully self-contained.

import { test, expect } from "@playwright/test";

test.describe("studio", () => {
  test("starts gated, then exposes the full studio after Start studio", async ({ page }) => {
    await page.goto("/studio");

    // Pre-ready: only the gate is visible.
    await expect(page.getByRole("heading", { name: /Ready when you are/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start studio/ })).toBeVisible();
    await expect(page.getByRole("grid", { name: "Pad grid" })).toHaveCount(0);

    await page.getByRole("button", { name: /Start studio/ }).click();

    // Active: TransportBar + Recorder + PadGrid + LibraryDrawer + EffectsRack.
    await expect(page.getByRole("button", { name: /Stop all/ })).toBeVisible();
    await expect(page.getByRole("grid", { name: "Pad grid" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Arm mic/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Effects rack/ })).toBeVisible();
    await expect(page.getByRole("complementary", { name: /Sample library/ })).toBeVisible();

    // 16 pads, all in the empty "+ load" state to start.
    const padButtons = page.getByRole("button", { name: /Pad \d+ empty/ });
    await expect(padButtons).toHaveCount(16);

    // The debug hook should report no audio.
    const initialState = await page.evaluate(() =>
      window.__looperDebug?.getPad(0),
    );
    expect(initialState?.loaded).toBe(false);
    expect(initialState?.playing).toBe(false);
  });

  test("loading a bundled sample onto pad 1 changes pad state", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /Start studio/ }).click();

    // Pad 1 is selected by default; click the "Kick · 90 BPM" library entry.
    await page.getByRole("button", { name: /Kick · 90 BPM/ }).click();

    // Pad button label flips from "empty" to "Play" once loaded.
    await expect(page.getByRole("button", { name: /Play pad 1/ })).toBeVisible();

    const loaded = await page.evaluate(() => window.__looperDebug?.getPad(0));
    expect(loaded?.loaded).toBe(true);
    expect(loaded?.playing).toBe(false);
    expect(loaded?.loopId).toMatch(/^synth:kick$/);
  });

  test("toggling a loaded pad starts and stops playback", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /Start studio/ }).click();
    await page.getByRole("button", { name: /Kick · 90 BPM/ }).click();

    await page.getByRole("button", { name: /Play pad 1/ }).click();
    let state = await page.evaluate(() => window.__looperDebug?.getPad(0));
    expect(state?.playing).toBe(true);

    await page.getByRole("button", { name: /Stop pad 1/ }).click();
    state = await page.evaluate(() => window.__looperDebug?.getPad(0));
    expect(state?.playing).toBe(false);
  });

  test("effects rack updates engine params", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /Start studio/ }).click();

    // Set reverb mix to ~0.5 by typing into the slider via keyboard arrows.
    const reverb = page.getByLabel("Reverb mix");
    await reverb.focus();
    // Default is 0, step 0.01 — press Right 50 times = 0.5.
    for (let i = 0; i < 50; i += 1) await page.keyboard.press("ArrowRight");

    const fx = await page.evaluate(() => window.__looperDebug?.getEffects());
    expect(fx?.reverbMix ?? 0).toBeGreaterThan(0.4);
    expect(fx?.reverbMix ?? 0).toBeLessThan(0.6);
  });

  test("muting pad zeroes its audio without removing it", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /Start studio/ }).click();
    await page.getByRole("button", { name: /Kick · 90 BPM/ }).click();

    await page.getByRole("button", { name: /Mute pad 1/ }).click();
    const muted = await page.evaluate(() => window.__looperDebug?.getPad(0));
    expect(muted?.mute).toBe(true);
    expect(muted?.loaded).toBe(true);
  });

  test("Stop all halts every playing pad", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /Start studio/ }).click();
    await page.getByRole("button", { name: /Kick · 90 BPM/ }).click();
    await page.getByRole("button", { name: /Play pad 1/ }).click();

    // Pad 1 plays.
    let s1 = await page.evaluate(() => window.__looperDebug?.getPad(0));
    expect(s1?.playing).toBe(true);

    await page.getByRole("button", { name: /Stop all pads/ }).click();
    s1 = await page.evaluate(() => window.__looperDebug?.getPad(0));
    expect(s1?.playing).toBe(false);
  });
});
