# web-e2e

_Area: `apps/web/e2e/` — Playwright BDD behavioural, live, and visual regression tests_

_Last full refresh: 2026-05-15T00:00:00Z_

## Overview

The E2E suite uses `playwright-bdd` with Gherkin feature files. Tests are organised into three layers:

| Tag | What it covers | Requires |
|---|---|---|
| `@behavioural` | Public pages with network stubs — fully offline | Dev server only |
| `@live` | Real API + DynamoDB Local | `pnpm localstack:up && pnpm localstack:seed && pnpm dev` |
| `@visual` | Screenshot regression at desktop (1440×900) and mobile (390×844) | Dev server only |

Scenario-level tags: `@smoke` (happy path), `@regression` (edge cases), `@a11y` (accessibility).

Run commands: `pnpm e2e` · `pnpm e2e:visual` · `pnpm e2e:update` (refresh snapshots).

---

## apps/web/e2e/fixtures.ts

Typed fixture extensions built on top of `playwright-bdd`'s `test.extend<>()`.

| Fixture | Type | Purpose |
|---|---|---|
| `loginPage` | `LoginPage` | Page object for `/login`. |
| `signupPage` | `SignupPage` | Page object for `/signup`. |
| `studioPage` | `StudioPage` | Page object for `/studio`. |
| `serverHit` | `{ value: boolean }` | Mutable tracker shared across steps to assert a route was not called. |
| `loggedIn` | `void` | Runs the full login flow (seeded user `test@test.com` / `testtest`) before the test body. |

Also exports `TEST_EMAIL` / `TEST_PASS` constants and re-exports `expect`.

---

## apps/web/e2e/pages/

Page Object Model classes. Constructor takes `readonly page: Page`. Actions are `async` methods; locators are `get` properties returning `Locator`. No assertions inside page objects.

| File | Page | Key methods / locators |
|---|---|---|
| `LoginPage.ts` | `/login` | `goto()`, `login(email, password)`, `blockLoginApi()` (aborts `**/auth/login`) · locators: `heading`, `emailField`, `passwordField`, `signInButton`, `createAccountLink`, `errorAlert` |
| `SignupPage.ts` | `/signup` | `goto()`, `signup(name, email, password)`, `interceptSignup(onCall)` (aborts `**/auth/signup` after callback), `stubSignupError(status, body)` · locators: `passwordField`, `errorAlert` |
| `StudioPage.ts` | `/studio` | `goto()`, `start()`, `loadSample(name)`, `getPadState(index)` / `getEffectsState()` (read `window.__looperDebug`) · locators: `gateHeading`, `startButton`, `padGrid`, `stopAllButton`, `armMicButton`, `effectsRack`, `sampleLibrary`, `emptyPads`, `reverbSlider` |

---

## apps/web/e2e/steps/

Step definitions. Each file imports `createBdd(test)` from `../fixtures.js` (not from `playwright-bdd` directly). Step bodies prefer page object methods over raw `page.*` calls.

| File | Covers |
|---|---|
| `auth.steps.ts` | Steps for auth-pages (`@behavioural`) and auth-live (`@live`) features — login, signup, route stubbing, redirect assertions. |
| `studio.steps.ts` | Steps for the studio feature — audio gate, pad interactions, effects rack, `__looperDebug` engine assertions. |
| `visual.steps.ts` | Steps for the visual-tour feature — viewport setup, page navigation, animation suppression, `toHaveScreenshot()` assertions. |

---

## apps/web/e2e/features/auth-pages.feature

**Tag:** `@behavioural` — runs fully offline (network stubs via `page.route()`).

Three rules:

- **Login page** (Background: given I am on the login page): page renders controls `@smoke`; API unreachable shows error `@regression`; Email field focuses on Tab `@a11y`.
- **Signup page** (Background: given I am on the signup page): short passwords rejected client-side without network call `@smoke`; duplicate email shows 409 conflict error `@regression`.
- **Home page**: links to login and signup `@smoke`.

---

## apps/web/e2e/features/auth-live.feature

**Tag:** `@live` — requires `pnpm localstack:up && pnpm localstack:seed && pnpm dev`. Seeded test user: `test@test.com` / `testtest`.

Three rules:

- **Login**: seeded user logs in and reaches studio/dashboard `@smoke`; wrong password shows error and stays on login `@regression`.
- **Protected routes**: authenticated user can access `/studio` directly `@smoke`; unauthenticated user is redirected to `/login` `@regression`.
- **Session lifecycle**: logout clears session and re-protects `/studio` `@regression`.

---

## apps/web/e2e/features/studio.feature

**Tag:** `@behavioural` — bundled synth samples load without a running API; Web Audio engine runs fully in-browser.

Background: given I am on the studio page. Two rules:

- **Startup gate**: studio shows gate before audio is enabled `@smoke`; clicking Start studio reveals full layout (TransportBar, PadGrid, EffectsRack, LibraryDrawer, 16 empty pads) `@smoke`.
- **Pad interactions** (Background: given I have started the studio): loading a bundled sample updates pad aria-label and `__looperDebug` state `@smoke`; toggling a loaded pad starts/stops playback `@regression`; muting zeroes audio without unloading `@regression`; Stop all halts every playing pad `@regression`; reverb slider updates engine parameter `@regression`.

---

## apps/web/e2e/features/visual-tour.feature

**Tag:** `@visual` — screenshot regression via `toHaveScreenshot()`. Reference PNGs committed under `e2e/__screenshots__/`.

Two rules with shared Backgrounds:

- **Desktop snapshots** (1440×900): home, login, signup, studio-gated, studio-active, dashboard.
- **Mobile snapshots** (390×844): same pages.

Before each snapshot, animation/transition styles are suppressed for stability. Run with `pnpm e2e:visual`; update references with `pnpm e2e:update`.

---

## apps/web/e2e/_screenshots.mjs

One-shot local screenshot driver — not part of the assertion suite. Run with `node e2e/_screenshots.mjs`. Saves PNGs to `e2e/__local-shots__/`. Visits home, login, signup, dashboard, account, and three studio states at desktop and mobile viewports. `BASE_URL` env var overrides the default `http://127.0.0.1:3000`.
