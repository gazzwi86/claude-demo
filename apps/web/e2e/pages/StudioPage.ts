import type { Page } from "@playwright/test";

export class StudioPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/studio");
  }

  async start() {
    await this.page.getByRole("button", { name: /Start studio/ }).click();
  }

  async loadSample(name: string) {
    await this.page.getByRole("button", { name }).click();
  }

  async getPadState(index: number) {
    return this.page.evaluate((i) => window.__looperDebug?.getPad(i), index);
  }

  async getEffectsState() {
    return this.page.evaluate(() => window.__looperDebug?.getEffects());
  }

  get gateHeading() {
    return this.page.getByRole("heading", { name: /Ready when you are/ });
  }

  get startButton() {
    return this.page.getByRole("button", { name: /Start studio/ });
  }

  get padGrid() {
    return this.page.getByRole("grid", { name: "Pad grid" });
  }

  get stopAllButton() {
    return this.page.getByRole("button", { name: /Stop all/ });
  }

  get armMicButton() {
    return this.page.getByRole("button", { name: /Arm mic/ });
  }

  get effectsRack() {
    return this.page.getByRole("region", { name: /Effects rack/ });
  }

  get sampleLibrary() {
    return this.page.getByRole("complementary", { name: /Sample library/ });
  }

  get emptyPads() {
    return this.page.getByRole("button", { name: /Pad \d+ empty/ });
  }

  get reverbSlider() {
    return this.page.getByLabel("Reverb mix");
  }
}
