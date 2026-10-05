# @looper/web — conventions

Next.js 15 (App Router) + React 19 + Tailwind 4. The studio app.

## Layout

- `app/(auth)/{login,signup}` — public auth pages (route group hides path segment)
- `app/(app)/{studio,dashboard,account}` — authed app, guarded by middleware
- `app/api/**` — only used as a thin edge proxy for cookie domain alignment if needed; primary backend is `@looper/api`
- `components/studio/` — domain components: `TransportBar`, `PadGrid`, `Pad`, `EffectsRack`, `LoopRecorder`, `Meter`, `LibraryDrawer`
- `components/ui/` — primitive components: `Button`, `Slider`, `Knob`, `Dialog`
- `lib/audio/` — Web Audio engine. Imperative classes (`PadNode`, `EffectsBus`) wrapped by hooks.
- `lib/api-client.ts` — fetch wrapper that targets `NEXT_PUBLIC_API_BASE_URL`, sends `credentials: "include"` for the auth cookie.
- `hooks/useAudioEngine.ts` — owns the `AudioContext` and pad map. Singleton-per-page.
- `e2e/features/` — Gherkin `.feature` files (`@behavioural`, `@live`, `@visual`; scenarios tagged `@smoke`, `@regression`, `@a11y`)
- `e2e/steps/` — Step definitions (`auth.steps.ts`, `studio.steps.ts`, `visual.steps.ts`); each imports `createBdd(test)` from `../fixtures.js`
- `e2e/pages/` — Page Object Model (`LoginPage`, `SignupPage`, `StudioPage`); actions as methods, locators as `get` properties
- `e2e/fixtures.ts` — Typed fixture extensions: `loginPage`, `signupPage`, `studioPage`, `serverHit`, `loggedIn`

## Conventions

- TypeScript everywhere. ESM. `.tsx` for components, `.ts` for non-React modules.
- **Audio handles live in refs, not React state.** Re-rendering must not recreate `AudioBufferSourceNode`s. Metadata about pads (which loop loaded, vol, mute) lives in state; the audio nodes themselves are imperative.
- `useAudioEngine` owns lifetime of the single `AudioContext`. Resume it on first user gesture (browser autoplay policy).
- Tailwind 4 — config lives in `app/globals.css` under `@theme`. No `tailwind.config.ts`.
- Colour palette is dark + neon-green accent; communicate state with colour and motion sparingly. Use `var(--color-…)` tokens, not hex literals.
- Visual snapshots committed under `e2e/__screenshots__/`. Update with `pnpm e2e:update` and inspect the diff.
- Every interactive control has an `aria-label`. Keyboard tab order must reach every transport control.
