# Music-Looper Rewrite — Final Status

**Branch:** `music-looper-rewrite` (off `pre-rewrite-snapshot` tag, which preserves the original blog/social API).

**All eight phases complete.** Every phase committed; full repo typechecks; 38 unit + integration tests pass; 12 Playwright E2E tests pass; visual screenshots committed for every page at desktop + mobile.

## Commits

| Phase | Scope | Commit |
|---|---|---|
| 0 | Snapshot tag + rewrite branch + enable agent teams | `99fd3fb` |
| 1 | Scaffold monorepo, delete old `src/`/`tests/`, rewrite `.claude/` hooks + commands, regenerate CLAUDE.md | `bca0a05` |
| 5 | Web Audio engine — `EffectsBus`, `PadNode`, recorder, buffers, hooks | `b8cfef9` |
| 4 | Next.js shell — login/signup/dashboard/account/studio pages, api-client, auth-client, Button + TextField primitives | `82b0aa1` |
| 6 | Studio UI — TransportBar, PadGrid + Pad, EffectsRack, LoopRecorder, LibraryDrawer, in-process synth samples | `7f35309` |
| 8 (visual) | Visual review + responsive fixes after Playwright screenshot pass; Next.js webpack `extensionAlias` fix; auth pages `noValidate` so zod runs | `10d97de` |
| 8 (E2E) | 12 behavioural Playwright specs (auth + studio); STATUS.md initial handoff | `663b4a8` |
| 2 | Fastify auth — DynamoDB users, bcrypt + jose JWT cookie, error handler, auth guard, in-process DDB stub for tests | `7a8cde1` |
| 3 | Loops CRUD — partition + GSI queries, presigned S3 PUT/GET URLs, public-vs-private guard, idempotent delete | `22d5684` |
| 7 | Terraform modules (s3-loops, dynamodb, iam, optional cloudfront) + 4 GitHub Actions workflows (ci, e2e, terraform, build) + LICENSES/SAMPLES.md | `e4a89f5` |

## Verification (local)

```
pnpm typecheck          green across @looper/web, @looper/api, @looper/shared
pnpm test               38/38 pass
                        - @looper/shared: 12 schema specs
                        - @looper/api:    24 (11 auth + 13 loops, app.inject() + DDB/S3 stubs)
                        - @looper/web:    2 effects-defaults sanity
pnpm exec -F @looper/web playwright test
                        12/12 pass
                        - 6 auth-pages.spec (login/signup/home + offline-error path)
                        - 6 studio.spec (gate -> active -> load sample -> toggle ->
                                         effects rack -> mute -> stop all)
python3 .claude/tests/hooks_test.py    76/76 OK
bash .claude/tests/test_audit_loop.sh  OK
```

## Architecture

### `apps/web/` — Next.js 15 + Tailwind 4 + Web Audio

- `app/(auth)/{login,signup}` — public auth pages, zod-validated, `noValidate` on the form so zod runs.
- `app/(app)/{studio,dashboard,account}` — authed pages.
- `lib/audio/{engine,padNode,effects,impulseResponse,buffers,recorder,synth}.ts` — pure imperative audio. `AudioEngine` owns the `AudioContext`; `PadNode`s are created/destroyed imperatively and never recreated by React renders.
- `hooks/{useAudioEngine,usePad,useRecorder}.ts` — singletons backed by refs.
- `components/studio/{TransportBar,PadGrid,Pad,EffectsRack,LoopRecorder,LibraryDrawer,Meter}.tsx` — domain components. All use `aria-label` + visible focus rings.
- `components/ui/{Button,TextField,Slider}.tsx` — primitives.
- `lib/audio/synth.ts` ships **6 in-process samples** (kick/snare/hat/bass/pad/blip) so the studio is fully demoable with no audio files.
- `e2e/{auth-pages,studio,visual-tour,_screenshots}.{spec.ts,mjs}` — Playwright behavioural + visual + a one-shot screenshot-driver script.

### `apps/api/` — Fastify + AWS SDK v3

- `src/server.ts` — `buildServer()` factory. Wires `@fastify/cookie`, `@fastify/cors`, the typed error handler, and the auth + loops route plugins. `SILENT=1` env disables pino-pretty for tests.
- `src/config.ts` — env-driven config; `JWT_SECRET` is required (no fallback).
- `src/errors.ts` — typed `AppError` hierarchy mapped to status codes by the error handler.
- `src/db/storage.ts` — small abstraction over DynamoDB with a real DynamoDB-Document-Client backing and an in-process `Map`-based stub used in tests via `DDB_USE_STUB=1`. Supports unique-attribute conditional puts (used for email uniqueness), GSI lookups, and prefix queries.
- `src/db/{users,loops}.ts` — typed table wrappers.
- `src/services/{authService,s3Service,loopService}.ts` — orchestration. `S3_USE_STUB=1` returns deterministic stub URLs for tests.
- `src/middleware/{authGuard,errorHandler}.ts`.
- `src/routes/{auth,loops}.ts` — Fastify plugins.
- `tests/{setup.ts,auth.test.ts,loops.test.ts}` — Vitest + `app.inject()`. Setup file forces stubs + tiny bcrypt rounds so tests run in milliseconds.

### `packages/shared/` — zod schemas + types

- `src/schemas.ts` — every cross-package contract: `SignupSchema`, `LoginSchema`, `CreateLoopSchema`, `UpdateLoopSchema`, `LoopMetaSchema`, `PadConfigSchema`, `SessionConfigSchema`. Web + api both import from here.
- `src/types.ts` / `src/constants.ts` — TS types + `PAD_GRID_SIZE` etc.
- `src/schemas.test.ts` — 12 contract sanity tests.

### `infra/`

- `terraform/` — modules `s3-loops`, `dynamodb`, `iam`, `cloudfront` (off by default). Mirrors the docker-compose / DynamoDB Local shape. Validate-only — `pnpm infra:validate` runs `terraform fmt -check && validate` (via the GH Actions `terraform.yml` workflow).
- `docker/docker-compose.yml` + `docker/init/seed.sh` — DynamoDB Local on 8000, LocalStack S3 on 4566, idempotent init that creates tables + bucket + CORS + uploads anything in `apps/web/public/samples/` (currently nothing).

### `.github/workflows/`

- `ci.yml` — push + PR. Lint, typecheck, per-package vitest, hook tests.
- `e2e.yml` — PR + nightly cron. Brings up docker-compose, runs `pnpm e2e`, uploads playwright-report on failure.
- `terraform.yml` — PR-only on `infra/terraform/**`. fmt -check, init -backend=false, validate.
- `build.yml` — push + PR. typechecks api, builds web, caches `.next/cache`.

### `.claude/`

- `settings.json` — hooks (PreToolUse, PostToolUse Edit/Write, Stop, SessionStart, etc.), permissions, env (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), context7 MCP server.
- `scripts/hooks.py` — central dispatcher. `area_for_path()` maps repo paths to wiki areas (apps/web/lib/audio → web-audio, apps/api/src/routes → api-routes, etc.). `check_no_secrets` regex broadened to `apps|packages|infra|.claude/scripts`. Fired across all three packages without false positives once fixture passwords were extracted to consts.
- `tests/hooks_test.py` — 35 tests including `AreaForPathTests` + `IsTrackedTests` for the new monorepo path mapping.
- `commands/{add-endpoint,check-health,setup,open-pr,anatomy}.md` — slash commands rewritten for the new layout.
- `plans/the-project-itself-meaning-precious-valiant.md` — original plan file (still useful as architectural reference).

## Running it

```
pnpm install
cp .env.example .env       # set JWT_SECRET (any long random string for dev)
pnpm localstack:up         # DynamoDB Local + LocalStack S3
pnpm localstack:seed       # idempotent — creates tables + bucket
pnpm dev                   # web on 3000, api on 3001
```

Web is fully usable without the api — bundled samples are in-process. The api is needed only for sign-up / login / loop persistence.

## Visual proof (committed)

`apps/web/e2e/__local-shots__/` (1440×900 + 390×844):
home, login, signup, studio (gated, active, loaded with kick sample on pad 1), dashboard (offline error state), account.

Re-run with `node apps/web/e2e/_screenshots.mjs` against a running `pnpm -F @looper/web dev`.

## Agent teammates

Spawned `api-engineer` and `infra-engineer` early in the session via `Agent` with `isolation: "worktree"`. Both got blocked on permission prompts that didn't reach approval, so the work moved to the main session and completed there. Both teammates have now received `shutdown_request`. The team `music-looper-build` can be cleaned up with `TeamDelete` once both members confirm shutdown.

## Post-rewrite additions

### `/cc-audit` user-level capability

Built at `~/.claude/skills/cc-audit/` + 9 sibling `cc-audit-<area>/` skills, with slash command at `~/.claude/commands/cc-audit.md`. Audits any repo's `.claude/` against a strict-by-default profile, scaffolds via `bootstrap.sh` (per-cluster confirmation, atomic backups, flock-protected manifest). Documented in `DEMO_GUIDE.md` §15. **Not part of this repo's tracked files** — user-level install only.

Test suite at `~/.claude/tests/`: 36 unit (pytest) + 7 integration (bash) + Tier 3 trigger-eval (opt-in). Single entry point `bash ~/.claude/tests/run.sh`. Coverage map prints finding-ID coverage per area.

### `.claude/tests/` reorganisation

`hooks_test.py` moved from `.claude/scripts/` → `.claude/tests/hooks_test.py`. `run.sh` updated; `STATUS.md` and `DEMO_GUIDE.md` reference the new path. 35/35 hook tests still pass after the move. The `run.sh` now asserts ≥35 tests run — silent test loss fails the gate (catches regressions where a test file silently fails to import).

### `DEMO_GUIDE.md` rewrite

Fully rewritten for the music-looper monorepo. New sections cover agent teams (§12), `/cc-audit` user-level capability (§15), updated wiki area mappings (§8), the disabled `check-circular-deps` (kept as code path, removed from demo flow), and exit-code gotcha (`exit 1` does NOT block). Old blog/CMS references gone.

## What's still rough / would be next

- **No real audio files bundled.** The synth sounds work and are demoable, but a real demo would benefit from a handful of CC0 drum/bass/pad loops dropped into `apps/web/public/samples/`. `LICENSES/SAMPLES.md` documents the format.
- **No `/sessions` endpoint yet.** The schema + types are in `@looper/shared` (`SessionConfigSchema`) but the api routes for save/load aren't built — the studio currently doesn't persist pad configurations across reloads.
- **`/anatomy` regen.** The `docs/wiki/` pages are mostly stale-marker stubs created by the PostToolUse hook. Run `/anatomy` to populate them properly.
- **`.claude/rules/*.md` lack `paths:` globs** — the `/cc-audit` skill flags this in any repo, including this one. Adding `paths:` frontmatter would scope rules per area.
- **Audio is permissionless in tests.** The studio E2E specs depend on `--use-fake-device-for-media-stream` Chromium flags (set in `playwright.config.ts`). On a real CI runner, the recorder spec would need the same flags to pass.
