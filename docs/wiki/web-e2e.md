# web-e2e

_Area: `apps/web/e2e/` — Playwright behavioural + visual regression tests_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/web/e2e/auth-pages.spec.ts

**Description:** 7 Playwright behavioural specs for public auth pages. No API server required — tests intercept network requests with `page.route()`. Covers: login page renders controls + link to signup; login shows error when API is unreachable (route aborted); email focuses on first Tab (a11y); signup validates short passwords client-side without a network hit (Zod); signup shows server error on 409 duplicate email response; home page has links to login and signup.

---

## apps/web/e2e/studio.spec.ts

**Description:** 6 Playwright behavioural specs for the studio page exercising the Web Audio engine end-to-end without a running API. Bundled synth samples load via `lib/audio/synth.ts` so the suite is fully self-contained. Covers: studio starts with audio gate visible and no pad grid; after clicking "Start studio" the full layout appears (TransportBar, PadGrid, EffectsRack, LibraryDrawer) with 16 empty pads; loading a bundled sample (Kick) onto pad 1 changes pad aria-label and sets `loaded=true` in `window.__looperDebug`; toggling the loaded pad starts/stops playback; effects rack slider changes update engine params (verified via `__looperDebug.getEffects()`); muting pad zeroes audio without removing the loop; Stop all halts every playing pad.

---

## apps/web/e2e/visual-tour.spec.ts

**Description:** Visual regression suite using Playwright's `toHaveScreenshot()`. Runs at both desktop (1440×900) and mobile (390×844) viewports. Covers: home page, login page, signup page, studio gated state, studio active state (after "enable audio" click), and dashboard offline/401 state. Before each screenshot, injects a style tag suppressing caret colour and all CSS animations/transitions for snapshot stability. Reference PNGs committed under `e2e/__screenshots__/`. Run with `pnpm e2e:visual`; update references with `pnpm e2e:update`.

---

## apps/web/e2e/auth-live.spec.ts

**Description:** Live integration tests that hit the real API on port 3001 + DynamoDB Local. Requires the full local stack: `pnpm localstack:up && pnpm localstack:seed && pnpm dev`. Uses the test user seeded by `infra/docker/init/seed.sh` (`test@test.com` / `testtest` — 8-character password matching `PasswordSchema` min). Covers 5 specs: login with seeded user redirects to `/studio` or `/dashboard` (10s timeout); wrong password surfaces a visible non-empty `role="alert"` and stays off `/studio|/dashboard`; authenticated user can navigate directly to `/studio` and see `<main>`; unauthenticated user visiting `/studio` is redirected to `/login`; logout navigates to `/account`, clicks the button matching `/sign.?out/i`, then verifies redirect to `/login` and that `/studio` is protected again.

---

## apps/web/e2e/_screenshots.mjs

**Description:** One-shot local screenshot driver (not part of the assertion suite). Run directly with `node e2e/_screenshots.mjs`. Saves PNGs to `e2e/__local-shots__/`. Launches a real Chromium instance with fake media stream flags enabled (bypasses mic permission prompt), then visits home, login, signup, dashboard, account, studio-gated, studio-active, and studio-loaded states at desktop (1440×900) and mobile (390×844) viewports. `BASE_URL` env var overrides the default `http://127.0.0.1:3000`.
