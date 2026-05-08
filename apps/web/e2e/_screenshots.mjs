// One-shot screenshot driver. Run with: node e2e/_screenshots.mjs
// Saves PNGs under e2e/__local-shots__/. Used by the team-lead during
// Phase 8 visual review (not part of the assertion suite).

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(process.cwd(), "e2e", "__local-shots__");
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";

async function shoot(page, file) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.addStyleTag({
    content: `
      * { caret-color: transparent !important; }
      *, *::before, *::after { animation: none !important; transition: none !important; }
    `,
  });
  await page.screenshot({ path: join(OUT, file), fullPage: true });
  console.log(`  -> ${file}`);
}

const views = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
];

const pages = [
  { path: "/", file: "home" },
  { path: "/login", file: "login" },
  { path: "/signup", file: "signup" },
  { path: "/dashboard", file: "dashboard" },
  { path: "/account", file: "account" },
  { path: "/studio", file: "studio-gated" },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
});

for (const view of views) {
  console.log(`\n[${view.name}]`);
  const context = await browser.newContext({ viewport: view.viewport });
  const page = await context.newPage();

  for (const p of pages) {
    await page.goto(`${BASE}${p.path}`);
    await page.waitForTimeout(400);
    await shoot(page, `${p.file}-${view.name}.png`);
  }

  const start = page.getByRole("button", { name: /start studio/i });
  if (await start.isVisible()) {
    await start.click();
    await page.waitForTimeout(900);
  }
  await shoot(page, `studio-active-${view.name}.png`);

  const firstSample = page.getByRole("button", { name: /Kick · 90 BPM/i });
  if (await firstSample.isVisible()) {
    await firstSample.click();
    await page.waitForTimeout(400);
  }
  await shoot(page, `studio-loaded-${view.name}.png`);

  await context.close();
}

await browser.close();
console.log("\ndone.");
