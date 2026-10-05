import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { test } from "../fixtures.js";

const { Given, When, Then } = createBdd(test);

// ── Navigation ────────────────────────────────────────────────────────────────

Given("I am on the studio page", async ({ studioPage }) => {
  await studioPage.goto();
});

// ── Studio lifecycle ──────────────────────────────────────────────────────────

Given("I have started the studio", async ({ studioPage }) => {
  await studioPage.start();
});

When("I click Start studio", async ({ studioPage }) => {
  await studioPage.start();
});

// ── Sample library ────────────────────────────────────────────────────────────

When("I load {string} from the library", async ({ studioPage }, sample: string) => {
  await studioPage.loadSample(sample);
});

Given("I have loaded {string} onto pad 1", async ({ studioPage }, sample: string) => {
  await studioPage.loadSample(sample);
});

// ── Pad controls ──────────────────────────────────────────────────────────────

When("I play pad 1", async ({ page }) => {
  await page.getByRole("button", { name: /Play pad 1/ }).click();
});

Given("I am playing pad 1", async ({ page }) => {
  await page.getByRole("button", { name: /Play pad 1/ }).click();
});

When("I stop pad 1", async ({ page }) => {
  await page.getByRole("button", { name: /Stop pad 1/ }).click();
});

When("I mute pad 1", async ({ page }) => {
  await page.getByRole("button", { name: /Mute pad 1/ }).click();
});

When("I click Stop all pads", async ({ page }) => {
  await page.getByRole("button", { name: /Stop all pads/ }).click();
});

// ── Effects rack ──────────────────────────────────────────────────────────────

When("I move the Reverb mix slider {int} steps right", async ({ studioPage }, steps: number) => {
  await studioPage.reverbSlider.focus();
  for (let i = 0; i < steps; i += 1) {
    await studioPage.page.keyboard.press("ArrowRight");
  }
});

// ── Assertions — layout ───────────────────────────────────────────────────────

Then("the {string} heading is visible", async ({ page }, text: string) => {
  await expect(page.getByRole("heading", { name: new RegExp(text) })).toBeVisible();
});

Then("the Start studio button is visible", async ({ studioPage }) => {
  await expect(studioPage.startButton).toBeVisible();
});

Then("the pad grid is not present", async ({ studioPage }) => {
  await expect(studioPage.padGrid).toHaveCount(0);
});

Then("the pad grid is visible", async ({ studioPage }) => {
  await expect(studioPage.padGrid).toBeVisible();
});

Then("the Stop all button is visible", async ({ studioPage }) => {
  await expect(studioPage.stopAllButton).toBeVisible();
});

Then("the Arm mic button is visible", async ({ studioPage }) => {
  await expect(studioPage.armMicButton).toBeVisible();
});

Then("the Effects rack is visible", async ({ studioPage }) => {
  await expect(studioPage.effectsRack).toBeVisible();
});

Then("the Sample library is visible", async ({ studioPage }) => {
  await expect(studioPage.sampleLibrary).toBeVisible();
});

Then("there are {int} empty pads", async ({ studioPage }, count: number) => {
  await expect(studioPage.emptyPads).toHaveCount(count);
});

Then("pad 1 shows the Play button", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Play pad 1/ })).toBeVisible();
});

// ── Assertions — audio engine ─────────────────────────────────────────────────

Then("the audio engine reports pad {int} as not loaded", async ({ studioPage }, index: number) => {
  const state = await studioPage.getPadState(index);
  expect(state?.loaded).toBe(false);
  expect(state?.playing).toBe(false);
});

Then("the audio engine reports pad {int} as loaded with loop {string}", async ({ studioPage }, index: number, loopId: string) => {
  const state = await studioPage.getPadState(index);
  expect(state?.loaded).toBe(true);
  expect(state?.loopId).toBe(loopId);
});

Then("the audio engine reports pad {int} as playing", async ({ studioPage }, index: number) => {
  const state = await studioPage.getPadState(index);
  expect(state?.playing).toBe(true);
});

Then("the audio engine reports pad {int} as not playing", async ({ studioPage }, index: number) => {
  const state = await studioPage.getPadState(index);
  expect(state?.playing).toBe(false);
});

Then("the audio engine reports pad {int} as muted", async ({ studioPage }, index: number) => {
  const state = await studioPage.getPadState(index);
  expect(state?.mute).toBe(true);
});

Then("the audio engine reports pad {int} as loaded", async ({ studioPage }, index: number) => {
  const state = await studioPage.getPadState(index);
  expect(state?.loaded).toBe(true);
});

Then("the reverb mix is between {float} and {float}", async ({ studioPage }, min: number, max: number) => {
  const fx = await studioPage.getEffectsState();
  expect(fx?.reverbMix ?? 0).toBeGreaterThan(min);
  expect(fx?.reverbMix ?? 0).toBeLessThan(max);
});
