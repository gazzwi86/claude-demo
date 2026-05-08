# Music-Looper Rewrite — Session Status

**Branch:** `music-looper-rewrite` (off `pre-rewrite-snapshot` tag, which preserves the original blog/social API)

## What landed in main worktree

| Phase | Scope | Commit | Status |
|---|---|---|---|
| 0 | Snapshot tag + rewrite branch + enable agent teams | `99fd3fb` | ✅ |
| 1 | Scaffold monorepo, delete old `src/`/`tests/`, update `.claude/` hooks + commands, regenerate CLAUDE.md | `bca0a05` | ✅ |
| 5 | Web Audio engine — `EffectsBus`, `PadNode`, recorder, buffers, hooks (`useAudioEngine`, `usePad`, `useRecorder`) | `b8cfef9` | ✅ |
| 4 | Next.js shell — login/signup/dashboard/account/studio pages, `api-client`/`auth-client`, Button + TextField primitives | `82b0aa1` | ✅ |
| 6 | Studio UI — TransportBar, PadGrid + Pad, EffectsRack, LoopRecorder, LibraryDrawer, in-process synth samples (kick/snare/hat/bass/pad/blip) | `7f35309` | ✅ |
| 8 (visual) | Visual review + responsive fixes after Playwright screenshot pass; Next.js webpack `extensionAlias` for `.js → .ts/.tsx`; auth pages `noValidate` so zod runs | `10d97de` | ✅ |
| 8 (E2E) | Behavioural specs — auth pages + studio (12/12 passing) | TBC commit | ✅ |

**12/12 Playwright E2E tests pass.** Visual screenshots committed under `apps/web/e2e/__local-shots__/` for desktop (1440×900) + mobile (390×844): home, login, signup, dashboard offline state, account, studio gated/active/loaded.

**Typecheck:** `pnpm typecheck` green across all three packages.

**Hook tests:** `python3 .claude/scripts/hooks_test.py` — 35/35 pass (including new `AreaForPathTests` + `IsTrackedTests` for the new monorepo path mapping).

## What is NOT yet landed — agent teammates in worktrees

Two parallel teammates were spawned via `Agent` with `isolation: "worktree"` and `team_name: "music-looper-build"`. Each is in its own git worktree (separate from this main worktree). Both hit early permission prompts that need approval before they can proceed. **Neither has reported back yet.**

| Teammate | Worktree branch | Phase | Last known state |
|---|---|---|---|
| `api-engineer` | (auto-named) | 2 + 3 — Fastify auth, DynamoDB users + loops, presigned S3 URLs, Vitest specs | Waiting on permission for `git branch -a && ls /Users/gareth/Sites/` |
| `infra-engineer` | (auto-named) | 7 — Terraform modules (s3-loops/dynamodb/iam/cloudfront), 4× GitHub Actions workflows | Waiting on permission for `pnpm install --frozen-lockfile` |

The web app currently runs **without the api** — the bundled synth samples live entirely in-process (`apps/web/lib/audio/synth.ts`), so the studio is fully demoable today. The dashboard page shows "Failed to fetch" gracefully when the api isn't up.

## How to resume

### If you're using the Claude Code CLI / VS Code in this same repo

You can continue the session and I'll pick up. The two agent worktrees should still exist; you may need to approve their pending permission prompts in the UI to unblock them.

### If you're starting a fresh session

The plan file at `.claude/plans/the-project-itself-meaning-precious-valiant.md` is the source of truth for what's left. Hand it to a fresh agent with this context:

> Resume the music-looper rewrite on branch `music-looper-rewrite`. Phases 0, 1, 4, 5, 6, and 8 (visual + E2E) are done in the main worktree (see git log). Phases 2, 3, and 7 are pending — `apps/api/` is a Fastify skeleton with `/health` only, `infra/terraform/` is empty, `.github/workflows/` is empty. Build them per the plan file. The web app already has a fully working studio against in-process synth samples; the missing api work just adds persistence (auth + loops + presigned S3) and the missing infra work adds the Terraform mirror + CI.

### Manual completion path (no further teammates needed)

If you'd rather just finish the remaining phases yourself in this repo:

1. **Phase 2 (auth)** — see `apps/api/CLAUDE.md` for conventions. Build:
   - `apps/api/src/db/{client,users}.ts` — DynamoDBDocumentClient + typed wrappers
   - `apps/api/src/services/authService.ts` — bcrypt + jose JWT
   - `apps/api/src/middleware/{authGuard,errorHandler}.ts`
   - `apps/api/src/routes/auth.ts` — POST /auth/{signup,login,logout}, GET /auth/me
   - `apps/api/tests/auth.test.ts` — `app.inject()` against DynamoDB Local (or `DDB_USE_STUB=1`)

2. **Phase 3 (loops + S3)** — same pattern:
   - `apps/api/src/db/loops.ts`
   - `apps/api/src/services/{loopService,s3Service}.ts` — presigned PUT/GET via `@aws-sdk/s3-request-presigner`
   - `apps/api/src/routes/loops.ts`
   - `apps/api/tests/loops.test.ts`

3. **Phase 7 (Terraform + CI)** — see `infra/CLAUDE.md`. Build modules (`s3-loops`, `dynamodb`, `iam`, `cloudfront`) + four workflows (`ci`, `e2e`, `terraform`, `build`). `pnpm infra:validate` exists at the root.

4. **Final polish**:
   - `pnpm exec playwright test` from `apps/web/` (currently 12/12)
   - Add `apps/web/e2e/visual-tour.spec.ts` snapshots to the committed reference set with `pnpm e2e:update`
   - Update `DEMO_GUIDE.md`
   - Run `/anatomy` to regenerate `docs/wiki/`

## Working stack reminder

- `pnpm dev` — concurrent web (3000) + api (3001)
- `pnpm test` — Vitest across all workspaces
- `pnpm e2e` — Playwright behavioural
- `pnpm e2e:visual` — Playwright `toHaveScreenshot()` (visual regression)
- `pnpm localstack:up` / `pnpm localstack:seed` — DynamoDB Local + LocalStack S3
- `pnpm infra:validate` — `terraform validate` (validate-only, never `apply`)

## Files of interest

- `.claude/plans/the-project-itself-meaning-precious-valiant.md` — full plan
- `apps/web/lib/audio/engine.ts` — singleton AudioEngine
- `apps/web/lib/audio/synth.ts` — in-process bundled samples
- `apps/web/app/(app)/studio/page.tsx` — studio orchestrator (state mirror + audio engine wiring)
- `apps/web/components/studio/` — TransportBar / PadGrid / Pad / EffectsRack / LoopRecorder / LibraryDrawer / Meter
- `packages/shared/src/schemas.ts` — every cross-package zod schema (signup, login, loop, session)
- `apps/web/e2e/{auth-pages,studio,visual-tour}.spec.ts` — 12 behavioural + visual specs
- `infra/docker/docker-compose.yml` + `infra/docker/init/seed.sh` — DynamoDB Local + LocalStack with idempotent table/bucket creation

## Visual proof

Reference screenshots from this pass:

- `apps/web/e2e/__local-shots__/home-{desktop,mobile}.png`
- `apps/web/e2e/__local-shots__/login-{desktop,mobile}.png`
- `apps/web/e2e/__local-shots__/signup-{desktop,mobile}.png`
- `apps/web/e2e/__local-shots__/studio-gated-{desktop,mobile}.png`
- `apps/web/e2e/__local-shots__/studio-active-{desktop,mobile}.png`
- `apps/web/e2e/__local-shots__/studio-loaded-{desktop,mobile}.png`  ← pad 1 with kick sample loaded, library highlights it
- `apps/web/e2e/__local-shots__/dashboard-{desktop,mobile}.png`
- `apps/web/e2e/__local-shots__/account-{desktop,mobile}.png`

Re-run with `node apps/web/e2e/_screenshots.mjs` (against a running `pnpm dev`).
