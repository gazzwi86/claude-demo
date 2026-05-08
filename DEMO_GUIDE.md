# Claude Code Demo Guide

A walkthrough script for demoing Claude Code features to engineers — and the quickest path to running everything in this repo.

The repo is a small but realistic browser-first music-looper monorepo (`apps/web` Next.js 15 + Web Audio, `apps/api` Fastify + DynamoDB, `packages/shared` Zod schemas, `infra/` Terraform + docker-compose). It exists to give Claude something *real* to chew on when we demo features like the LLM wiki, Graphify, hooks, and the user-level `/cc-audit` capability.

The previous blog/CMS state of this repo is preserved at the `pre-rewrite-snapshot` git tag.

---

## 0. Quickstart Runbook

### One-time setup

```bash
git clone <this-repo> && cd claude-demo
claude                       # opens the REPL with this repo's settings.json
```

Then inside the REPL:

```text
> /setup            # wires git hooks via core.hooksPath, chmods scripts
> /setup graphify   # optional: also installs Graphify + indexes the repo
```

There are no `npm run setup*` scripts. Setup is itself a slash command, in keeping with the rest of this demo. The `SessionStart` hook (`hooks.py session-start`) detects unsetup state on REPL open and prints a one-line reminder to run `/setup`.

`/setup` configures `git config core.hooksPath .claude/scripts/git-hooks` so `pre-commit` and `pre-push` are versioned with the repo (no `.git/hooks` copy step). `/setup graphify` requires [uv](https://docs.astral.sh/uv/) and runs `uv tool install graphifyy && graphify install && graphify claude install && graphify index .`. Skip if you don't want Graphify in the demo.

To actually run the app:

```bash
pnpm install
cp .env.example .env       # set JWT_SECRET (any long random string for dev)
pnpm localstack:up         # DynamoDB Local + LocalStack S3
pnpm localstack:seed       # idempotent — creates tables + bucket
pnpm dev                   # web on 3000, api on 3001
```

Web is fully usable without the api — bundled samples are in-process. The api is only needed for sign-up / login / loop persistence.

### Demo flow (live, ~20 minutes)

| # | Show | Trigger | What to call out |
|---|------|---------|------------------|
| 1 | Project context (`CLAUDE.md` hierarchy) | open `CLAUDE.md`, `apps/web/CLAUDE.md`, `apps/api/CLAUDE.md` | Progressive disclosure — only loads what's relevant; per-package CLAUDE.md overrides global rules. |
| 2 | Settings tour | open `.claude/settings.json` | Permissions allow/ask/deny, hooks, attribution, statusLine, plansDirectory, env (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). |
| 3 | Status line | look at the bar above the prompt | `claude-demo · main* · Opus 4.7` from `.claude/scripts/statusline.sh`. |
| 4 | Hooks: pre-write secrets | ask Claude to write `password = "hunter2hunter2"` under `apps/api/src/` | `PreToolUse:Edit\|Write` runs `hooks.py pre-tool-use check-no-secrets` and blocks before disk write. |
| 5 | Hooks: prompt vs command-with-claude-p | ask Claude to write `apps/api/src/leak.ts` with `eval("...")` or a fake `sk-...` token | Same matcher fires `type: "prompt"` (native) **and** `hooks.py post-tool-use claude-review` (command shells out to `claude -p`). Two ways to do the same thing. |
| 6 | Hooks: anatomy stale-marker | edit `apps/web/lib/audio/effects.ts`, then open `docs/wiki/web-audio.md` | `PostToolUse:Edit\|Write` runs `hooks.py post-tool-use mark-anatomy-stale` and appends `<!-- stale: ... -->`. |
| 7 | Native skills | type `/simplify`, `/security-review`, `/review` | All native, no install. |
| 8 | Custom slash commands | type `/add-endpoint`, `/check-health`, `/anatomy` | Scaffolds, probes `/health`, regenerates the wiki using existing patterns. |
| 9 | LLM wiki | type `/anatomy refresh apps/web/lib/audio/engine.ts` | Regenerates `docs/wiki/web-audio.md` from the source. Karpathy-style structured wiki. |
| 10 | Wiki refresh on commit | `git commit -m "..."` | Pre-commit calls `claude -p "/simplify"` then `/anatomy refresh` for staged files; commit picks up wiki updates. |
| 11 | Wiki freshness gate | `python3 .claude/scripts/hooks.py check-anatomy-fresh` | Pre-push runs the same check; blocks push if stale. Bypass with `--no-verify`. |
| 12 | Orchestrator | type `/open-pr` | `/simplify` → `/security-review` → `gh pr create` → `/review` on the new PR. |
| 13 | Graphify | `/setup graphify` once, then ask Claude "use graphify to find all callers of `createPad`" | Token-efficient knowledge-graph queries over the codebase. |
| 14 | MCP | `.claude/settings.json` `mcpServers`; ask "fetch React 19 docs" | `context7` MCP wired per-project. |
| 15 | Plan mode | `Shift+Tab` then "add a `/sessions` route to persist pad config" | Plans persist to `./plans/`. |
| 16 | Local-LLM Stop hook | run `/setup llm` to wire ollama/LM Studio + a small model (e.g. `gemma4:e4b`); let conversation drift to a new topic | Stop hook prints `✨ conversation hygiene: consider /compact …` with a one-line reason from the local model. Token-gated so it doesn't run on every turn. |
| 17 | Hook tests | `bash .claude/tests/run.sh` | Discovers `*_test.py` under `.claude/`, runs `hooks_test.py` (35 tests). Also lists `*.eval.md` skill evals. |
| 18 | Agent teams | `.claude/settings.json` env `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Spawn parallel teammates via `Agent({team_name, name})` for fan-out work; coordinate via `SendMessage`. |
| 19 | `/cc-audit` (user-level) | type `/cc-audit` | Audits the current repo's `.claude/` against a strict-by-default profile; fans out 9 parallel sub-skills; emits a plan-mode diff bundle. See §15. |

---

## 1. Project Configuration (`CLAUDE.md` — Progressive Disclosure)

- `CLAUDE.md` at the repo root is always loaded.
- Subdirectory `CLAUDE.md` (e.g. `apps/web/CLAUDE.md`, `apps/api/CLAUDE.md`, `packages/shared/CLAUDE.md`, `infra/CLAUDE.md`) loads only when Claude works in that directory.
- **Per-package CLAUDE.md overrides** the top-level rules within its tree. Always check the local file before assuming a convention.
- Keeps context focused and token-efficient.

---

## 2. Settings (`settings.json` vs `settings.local.json`)

| Key | Purpose |
|---|---|
| `permissions.allow` / `ask` / `deny` | Pre-approve, prompt, or block tool patterns. |
| `env` | Env vars applied to every session (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, `teammateMode=auto`). |
| `hooks` | Run shell commands or prompt-type evaluations on Claude events. |
| `mcpServers` | Project-level MCP servers (here: `context7`). |
| `statusLine` | Custom status bar above the prompt. |
| `attribution.commit` / `attribution.pr` | Default suffix on commits and PR bodies. |
| `plansDirectory` | Where `/plan` files are stored (here: `./.claude/plans`). |

Deprecated `ignorePaths` was replaced with `permissions.deny "Read(./.env)"` etc. The current deny list also covers `Bash(curl*)`, `Bash(rm -rf *)`, `Bash(git push --force*)` and reads of `.env*`, `*.pem`, `*.key`.

---

## 3. Rules Directory (`.claude/rules/`)

Always loaded, unlike `CLAUDE.md`. Use for cross-cutting concerns:

- `.claude/rules/security.md` — secret-handling, eval ban, input sanitisation.
- `.claude/rules/testing.md` — Node test runner, deterministic asserts.
- `.claude/rules/code-style.md` — code conventions.

**Note:** these files currently lack `paths:` glob frontmatter, so they apply globally. The user-level `/cc-audit` skill will flag this in any repo it audits.

---

## 4. Hooks

Two distinct things. **Don't conflate them.**

### 4a. Claude Code hooks (in `.claude/settings.json`)

Run on Claude's tool/session events. Cannot directly invoke a slash command — they shell out to a command, send a prompt to a model, hit an HTTP endpoint, etc.

**One dispatcher, every event.** All `command`-type hooks route through `.claude/scripts/hooks.py <event> [check]`. The python file has a handler for every hook event Claude Code emits (PreToolUse, PostToolUse, Notification, UserPromptSubmit, Stop, SubagentStop, PreCompact, SessionStart, SessionEnd) — placeholders for events we don't currently use, real logic for the ones we do. New hooks land here, not in fresh files.

| Event | Matcher | Type | Handler | Behaviour |
|---|---|---|---|---|
| `PreToolUse` | `Edit\|Write` | `command` | `hooks.py pre-tool-use check-no-secrets` | Inspects `tool_input.content` *before* write. Regex covers `apps|packages|infra|.claude/scripts/`. Exit 2 = block. |
| `PreToolUse` | `Glob\|Grep` | `command` | `hooks.py pre-tool-use graphify-hint` | Emits `additionalContext` nudging Claude to consult the graphify index when present. |
| `PostToolUse` | `Edit\|Write` | `command` | `hooks.py post-tool-use mark-anatomy-stale` | Appends `<!-- stale: <path> -->` to the wiki page for that area. Always exits 0. |
| `PostToolUse` | `Edit\|Write` | `command` | `hooks.py post-tool-use claude-review` | Shells out to `claude -p` for an LLM review. Same intent as the `prompt:` hook below; different mechanism. Async, 45s budget. |
| `PostToolUse` | `Edit\|Write` | `prompt` | inline | LLM returns `{"decision":"block","reason":"..."}` on secret/eval finding. |
| `Stop` | — | `command` | `hooks.py stop` | Token-gated drift detector. Above `STOP_HOOK_DRIFT_GATE` (default 30%) it asks a *local* LLM (ollama or LM Studio, configured by `/setup`) whether to suggest `/compact` or `/clear`, then prints the verdict to stderr. Silent no-op when `LLM_BACKEND` is unset. |
| `SessionStart` | — | `command` | `hooks.py session-start` | Detects unsetup state (no `core.hooksPath`, no graphify index) and prints a one-liner reminder. |
| `Notification` / `UserPromptSubmit` / `SubagentStop` / `PreCompact` / `SessionEnd` | — | `command` | `hooks.py <event>` | Wired as placeholders so every event lands in one file. |

`check-circular-deps` exists as a code path in `hooks.py` but is currently disabled — the original CommonJS `require()` walker doesn't apply to the TypeScript+ESM rewrite. Re-enable by shelling to `madge --circular --extensions ts,tsx` if a cycle gate is wanted again.

**Two ways to do the same thing — by design.** The `claude-review` command-hook and the `prompt:` hook on `PostToolUse:Edit|Write` both ask an LLM to flag secrets/eval. Use the `prompt:` form when you want the runtime to handle the call; use `claude -p` from a command-hook when you need full control (model, output-format, working dir, env, parsing the verdict yourself).

**Important matchers nuance:** `PreToolUse`/`PostToolUse` matchers match the *tool name* (`Bash`, `Edit|Write`, `mcp__.*`), **not** file paths. Path/folder filtering happens *inside* the script via `tool_input.file_path`. The only path-style matcher is `FileChanged`, and it's literal pipe-separated basenames — no globs.

**Exit-code gotcha:** `0` = success, `2` = block (stderr → Claude). **`exit 1` does NOT block** — Unix convention is flipped here.

**Stdin contract:** every hook receives JSON on stdin (`tool_name`, `tool_input`, `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`). The `prompt` type substitutes that JSON into `$ARGUMENTS`.

### 4b. Git hooks (in `.claude/scripts/git-hooks/`)

Run on `git commit` / `git push` regardless of who's driving. Wired via `git config core.hooksPath`.

| Hook | What it runs | Skip |
|---|---|---|
| `pre-commit` | `claude -p "/simplify"` on staged files, then `claude -p "/anatomy refresh ..."` to update wiki, then `git add ANATOMY.md docs/wiki/` | `--no-verify` |
| `pre-push` | `python3 .claude/scripts/hooks.py check-anatomy-fresh` (blocks if stale), then `claude -p "/security-review"` | `--no-verify` |

### 4c. Tests for the hooks themselves (`.claude/tests/run.sh`)

Two distinct test surfaces in this repo:

| Surface | Lives in | Tests | Run via |
|---|---|---|---|
| **App code** | `apps/{web,api}/tests/`, `apps/{web,api}/**/__tests__/`, `packages/shared/src/*.test.ts` | Vitest unit tests; Playwright E2E + visual | `pnpm test`, `pnpm e2e`, `pnpm e2e:visual` |
| **Claude scaffolding** | `.claude/tests/*_test.py` | Hook scripts, helpers in `hooks.py`, future slash-command/skill evals | `bash .claude/tests/run.sh` |

Convention:
- **Unit tests live in `.claude/tests/`** as `<name>_test.py`. The runner asserts `≥35` tests run — silent test loss fails the gate.
- **Skill / agent / command evals as `<name>.eval.md`** next to the `.md` they exercise. The runner lists them but doesn't execute them — they're prompts, you run them with `claude -p "$(cat <evalfile>)"` when you want to evaluate.
- **`.claude/tests/run.sh`** is the single entry point. CI-friendly (non-zero exit on failure).

Current scaffolding test: `.claude/tests/hooks_test.py` — **35 tests** covering:
- The Stop hook's pure helpers (token estimate, prompt build, verdict parse, excerpt budgeting against `LLM_CONTEXT_TOKENS`).
- The end-to-end `stop()` flow with `_ask_local_llm` mocked.
- `area_for_path()` mapping (apps/web/lib/audio → web-audio, apps/api/src/routes → api-routes, etc.).
- `is_tracked()` predicate for the new monorepo layout.

Total runtime: ~6ms.

---

## 5. Custom Agents (`.claude/agents/`)

Markdown files defining specialised sub-agents (model, tools, system prompt). Files: `.claude/agents/api-designer.md`, `.claude/agents/test-writer.md`. Useful for code review, test writing, API design, migrations.

---

## 6. Custom Slash Commands (`.claude/commands/`)

| Command | Purpose |
|---|---|
| `/setup [graphify\|llm]` | Wire git hooks, chmod scripts, optionally install graphify or configure local-LLM Stop hook. Idempotent. Replaces `npm run setup`. |
| `/add-endpoint <name>` | Scaffold a Fastify route in `apps/api` or a Next.js route handler in `apps/web` with shared zod schema and Vitest test. |
| `/check-health` | Start the `apps/api` server and probe `/health`. |
| `/anatomy [refresh\|lint]` | Generate or refresh the structured wiki (full / refresh / lint modes). |
| `/open-pr` | `/simplify` → `/security-review` → `git push` → `gh pr create` → `/review`. |

---

## 7. Native skills (no install)

| Skill | What it does |
|---|---|
| `/simplify` | Reviews recently-changed code for reuse, quality, efficiency. |
| `/review` | Reviews a pull request. |
| `/security-review` | Security review of pending branch changes. |
| `/init` | Bootstraps a `CLAUDE.md` from the codebase. |

`/code-review` is a marketplace plugin (`code-review@claude-plugins-official`) — install via `claude plugin install code-review`. **`/advisor` does not exist** (we checked).

---

## 8. The LLM Wiki + `/anatomy` (Karpathy pattern)

Implements [karpathy's "build a wiki, not a chat history" pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

### Three layers

| Layer | Lives in | Owner |
|---|---|---|
| **Raw sources** | `apps/web/`, `apps/api/`, `packages/shared/`, `infra/` | Engineers |
| **The Wiki** | `ANATOMY.md`, `docs/wiki/<area>.md` | The LLM (kept in sync by hooks + `/anatomy`) |
| **The Schema** | `.claude/commands/anatomy.md`, `CLAUDE.md`, `.claude/rules/` | Team |

### Wiki areas (post-rewrite)

The `area_for_path()` helper in `hooks.py` maps repo paths to wiki pages:

| Path | Wiki page |
|---|---|
| `apps/web/lib/audio/...` | `docs/wiki/web-audio.md` |
| `apps/web/components/studio/...` | `docs/wiki/web-studio.md` |
| `apps/web/app/...` | `docs/wiki/web-pages.md` |
| `apps/web/components/ui/...` | `docs/wiki/web-ui.md` |
| `apps/web/lib/...` | `docs/wiki/web-lib.md` |
| `apps/web/hooks/...` | `docs/wiki/web-hooks.md` |
| `apps/web/e2e/...` | `docs/wiki/web-e2e.md` |
| `apps/api/src/{routes,services,db,middleware,errors.ts}` | `docs/wiki/api-{routes,services,db,middleware,errors.ts}.md` |
| `apps/api/tests/...` | `docs/wiki/api-tests.md` |
| `packages/shared/...` | `docs/wiki/shared.md` |
| `infra/terraform/...` | `docs/wiki/infra-terraform.md` |

### Three modes

| Mode | Trigger | Effect |
|---|---|---|
| Full refresh | `/anatomy` | Walk all source, rewrite every wiki page from scratch. |
| Incremental | `/anatomy refresh <files>` | Update only the entries for those files. Used by pre-commit. |
| Lint | `/anatomy lint` | Read-only health check (orphan files, missing entries, contradictions). |

### How freshness is enforced

1. **`PostToolUse:Edit|Write` hook** marks the touched area page stale (`<!-- stale: apps/web/lib/audio/effects.ts -->`).
2. **Pre-commit** runs `/anatomy refresh` for staged tracked files and `git add`s the wiki diff into the commit.
3. **Pre-push** runs `hooks.py check-anatomy-fresh`; any remaining `<!-- stale: ... -->` blocks the push with a copy-paste refresh command.

The wiki cannot drift more than one commit behind the code, and only blocks at push time — the lowest-friction enforcement point.

---

## 9. Graphify (knowledge-graph over the repo)

[Graphify](https://github.com/safishamsi/graphify) is a Claude-Code-native tool that converts a codebase (and docs/PDFs/images) into a queryable knowledge graph. Claude consults the graph instead of reading raw files for searches — significantly cheaper on large repos.

### Setup

```text
> /setup graphify
```

Runs `uv tool install graphifyy && graphify install && graphify claude install && graphify index .` (via `.claude/scripts/setup-graphify.sh`). Requires [uv](https://docs.astral.sh/uv/) on PATH.

### Demo

```text
> use graphify to list every callsite of createPad
> use graphify to show the dependency graph between apps/api/src/services and apps/api/src/routes
> use graphify to find files that import @looper/shared
```

### Why pair it with `/anatomy`?

- **Graphify** = fast structural index (callsites, imports, types). LLM-driven retrieval.
- **`/anatomy`** = human-curated, prose descriptions of intent. LLM-maintained markdown.

They're complementary: Graphify answers "where is X used?", anatomy answers "what is X for?".

---

## 10. MCP Servers (Project-Level)

Configured in `.claude/settings.json` under `mcpServers`. This repo wires `context7` for live documentation.

```bash
claude mcp add my-server npx -y @some/mcp-server
claude mcp list
```

---

## 11. CLI Features Demo

### Headless / CI mode (used by our git hooks)

```bash
claude -p "/simplify Focus on these files: apps/web/lib/audio/effects.ts" --output-format text
echo "explain this error" | claude -p
```

### Plan mode

`Shift+Tab` toggles plan mode. Plans land in `.claude/plans/`.

### Auto mode

```bash
claude --auto
claude --allowedTools "Edit,Write,Read,Bash(pnpm test)"
```

### Context mentions

`@file:apps/web/lib/audio/engine.ts`, `@url:...`, `@git:main..HEAD`.

---

## 12. Agent teams

The repo enables agent teams via `.claude/settings.json` env: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, `teammateMode=auto`.

Spawn fan-out work via the `Agent` tool with `team_name` and `name`:

```python
Agent({
  team_name: "music-looper-build",
  name: "api-engineer",
  subagent_type: "general-purpose",
  prompt: "Build apps/api/src/services/loopService.ts per the plan ..."
})
```

Coordinate via `SendMessage({to: "<name>", message: "..."})`. Teammates can join the team via the same `team_name`. Shut down with `SendMessage({to: "<name>", message: {type: "shutdown_request"}})`.

**Footgun spotted in this project:** teammates can deadlock on permission prompts the user hasn't seen — they go idle waiting for approval and queued messages don't get processed. Either approve permissions in advance via `permissions.allow`, or have the team-lead shut deadlocked teammates down and fall back to direct work.

---

## 13. Project File Tree

```
claude-demo/
├── CLAUDE.md
├── DEMO_GUIDE.md
├── ANATOMY.md                          ← LLM-owned; generated by /anatomy
├── STATUS.md                           ← rewrite handoff
├── package.json                        ← workspaces
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── apps/
│   ├── web/                            ← Next.js 15 + Tailwind 4 + Web Audio
│   │   ├── CLAUDE.md
│   │   ├── app/                        ← App Router (auth + studio + dashboard + account)
│   │   ├── components/{studio,ui}/
│   │   ├── lib/audio/                  ← AudioEngine, PadNode, EffectsBus, recorder
│   │   ├── hooks/                      ← useAudioEngine, usePad, useRecorder
│   │   ├── e2e/                        ← Playwright behavioural + visual specs
│   │   └── public/samples/
│   └── api/                            ← Fastify + AWS SDK v3
│       ├── CLAUDE.md
│       └── src/
│           ├── server.ts
│           ├── config.ts errors.ts
│           ├── routes/{auth,loops}.ts
│           ├── services/{authService,loopService,s3Service}.ts
│           ├── db/{users,loops,storage}.ts
│           └── middleware/{authGuard,errorHandler}.ts
├── packages/
│   └── shared/                         ← @looper/shared — zod schemas + types
│       ├── CLAUDE.md
│       └── src/{schemas,types,constants,index}.ts
├── infra/
│   ├── CLAUDE.md
│   ├── terraform/                      ← validate-only modules
│   │   └── modules/{s3-loops,dynamodb,iam,cloudfront}/
│   └── docker/                         ← docker-compose + seed.sh
├── docs/
│   └── wiki/                           ← LLM-owned per-area pages
│       ├── web-audio.md  web-studio.md  web-pages.md  web-hooks.md  web-ui.md
│       ├── web-lib.md    web-e2e.md
│       ├── api-routes.md api-services.md api-db.md  api-middleware.md  api-tests.md
│       ├── shared.md     infra-terraform.md
│       └── ...
├── .github/workflows/                  ← ci, e2e, terraform, build
└── .claude/
    ├── settings.json
    ├── settings.local.json             ← gitignored
    ├── rules/{security,testing,code-style}.md
    ├── agents/{api-designer,test-writer}.md
    ├── commands/{add-endpoint,check-health,setup,open-pr,anatomy}.md
    ├── plans/                          ← plansDirectory
    ├── tests/
    │   ├── run.sh                      ← single entry point, asserts ≥35 tests run
    │   └── hooks_test.py               ← 35 tests for hooks.py
    └── scripts/                        ← Claude-only scripts
        ├── hooks.py                    ← single dispatcher for every hook event
        ├── statusline.sh
        ├── setup-graphify.sh
        └── git-hooks/{pre-commit,pre-push}
```

---

## 14. Things That Look Real But Aren't

While preparing this repo we validated a popular third-party hooks README against the official docs. Beware:

- `$CLAUDE_FILE_PATH` env var — fabricated. File path comes from stdin JSON `tool_input.file_path`.
- `/advisor` slash command — not native and not on the official marketplace.
- `ignorePaths` in `settings.json` — deprecated; use `permissions.deny "Read(...)"`.
- Hook `exit 1` blocking — it doesn't. Only `exit 2` blocks.
- `forceLoginMethod: ["claudeai"]` array form — fails silently. It's a string, not array.

When you copy-paste from the internet, sanity-check against `https://code.claude.com/docs/en/hooks` and `https://code.claude.com/docs/en/settings`.

---

## 15. `/cc-audit` — user-level Claude Code config audit (bonus demo)

A user-level capability installed at `~/.claude/skills/cc-audit/` plus 9 sibling `~/.claude/skills/cc-audit-<area>/` skills, with slash command `/cc-audit`. **Not part of this repo** — installed once, runs against any repo.

### What it does

1. **Inspect** the target repo deterministically (languages, monorepo signals, OSS, managed policy, existing `.claude/`).
2. **Interview** via ≤8 MCQ questions for ambiguous decisions.
3. **Fan out 9 parallel sub-skills** (`cc-audit-{settings,permissions,security,claude-md,skills,hooks,git-hooks,enterprise,monorepo}`), each emitting Finding JSON.
4. **Merge** findings, dedupe cross-area concerns.
5. **Council critique** — 5 personas (Security analyst, Lead engineer, AI-novice, DevOps, Karpathy-style reviewer) emit structured `propose:{add,change,remove}` ops.
6. **Emit** plan-mode diff bundle + `<repo>/.claude/reports/CLAUDE-CONFIGURATION-AUDIT.md`.
7. With `--apply`, invokes `bootstrap.sh` (per-cluster confirmation, atomic backups, flock-protected manifest).

### Strict-by-default profile

The baseline ships:
- Self-modification guard: `Edit/Write(./.claude/settings.json)` and `Edit/Write(./.claude/scripts/hooks.py)` denied.
- IaC plan-before-apply: `terraform apply` / `cdk deploy` / `pulumi up` blocked without a fresh plan marker.
- Secret scan: gitleaks if installed, regex fallback always active.
- PII masking on `Stop`.
- `--no-verify` deny via PreToolUse:Bash hook.

### Run against this repo

```bash
/cc-audit                # plan only
/cc-audit --dry-run      # diff without writing
/cc-audit --apply        # scaffold with per-cluster confirmation
/cc-audit --lite         # solo/throwaway profile
/cc-audit --force        # re-apply ignoring manifest
```

### Test suite

The cc-audit capability has its own test tree at `~/.claude/tests/`:
- **36 unit tests** (pytest): per-skill `inspect.py`, cross-skill ownership-boundary check, orchestrator fan-out (trace mode), trigger-parser smoke.
- **7 integration tests** (bash): `bootstrap.sh` apply/dry-run/idempotent/Husky-collision, guards, manifest atomicity, user-edit drift.
- **Tier 3 trigger eval** (opt-in, ~$0.50): does the model invoke the right skill for a natural-language prompt?
- Single entry point: `bash ~/.claude/tests/run.sh`. Coverage map prints finding-ID coverage per area.

Demo-flow value: `/cc-audit` against this very repo surfaces (correctly) that `Edit/Write(./.claude/settings.json)` and `Edit/Write(./.claude/scripts/hooks.py)` denies are missing, gitleaks isn't installed, and `.claude/rules/*.md` lack `paths:` glob frontmatter. All real, all addressable.

---

## 16. Bonus Topics

- **Memory system** — `~/.claude/projects/<repo>/memory/`. Persists across sessions; saves user/feedback/project/reference notes the model can recall later.
- **Worktrees** — agents can work in isolated git worktrees via `Agent({isolation: "worktree"})`.
- **Keybindings** — customise in `~/.claude/keybindings.json`.
- **`/cost`**, **`/compact`**, **`/init`**, **Esc** to interrupt, **Shift+Tab** for plan mode.
- **Pre-rewrite snapshot** — the original blog/CMS state of this repo lives at the `pre-rewrite-snapshot` git tag. `git checkout pre-rewrite-snapshot` to see it.
