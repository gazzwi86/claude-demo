# Claude Code Demo Guide

A walkthrough script for demoing Claude Code features to engineers — and the quickest path to running everything in this repo.

The repo is a small but realistic blog/CMS REST API (~40 source files, zero external deps, Node `node:test` only). It exists to give Claude something *real* to chew on when we demo features like the LLM wiki, Graphify, and the hook-driven refresh loops.

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

### Demo flow (live, ~15 minutes)

| # | Show | Trigger | What to call out |
|---|------|---------|------------------|
| 1 | Project context (`CLAUDE.md` hierarchy) | open `CLAUDE.md`, `src/CLAUDE.md`, `tests/CLAUDE.md` | Progressive disclosure — only loads what's relevant. |
| 2 | Settings tour | open `.claude/settings.json` | Permissions allow/ask/deny, hooks, attribution, statusLine, plansDirectory. |
| 3 | Status line | look at the bar above the prompt | `claude-demo · main* · Opus 4.7` from `.claude/scripts/statusline.sh`. |
| 4 | Hooks: deterministic | ask Claude to add `src/utils/foo.js` requiring `./bar`, then `src/utils/bar.js` requiring `./foo` | `PostToolUse:Edit\|Write` calls `hooks.py post-tool-use check-circular-deps`, blocks on the cycle. |
| 5 | Hooks: prompt vs command-with-claude-p | ask Claude to write `src/utils/leak.js` containing `eval("...")` or `sk-fake-token` | Same matcher fires `type: "prompt"` (native) **and** `hooks.py post-tool-use claude-review` (command shells out to `claude -p`). Two ways to do the same thing. |
| 6 | Hooks: pre-write secrets | ask Claude to write `password = "hunter2hunter2"` under `src/` | `PreToolUse:Edit\|Write` runs `hooks.py pre-tool-use check-no-secrets` and blocks before disk write. |
| 7 | Native skills | type `/simplify`, `/security-review`, `/review` | All native, no install. |
| 8 | Custom slash commands | type `/add-endpoint products` | Scaffolds route + service + tests using existing patterns. |
| 9 | Anatomy / LLM wiki | type `/anatomy` | Generates `ANATOMY.md` + `docs/wiki/<area>.md`. Karpathy-style structured wiki. |
| 10 | Wiki auto-staling | edit `src/utils/pagination.js`; check `docs/wiki/utils.md` | PostToolUse hook stale-marked it instantly. |
| 11 | Wiki refresh on commit | `git commit -m "..."` | Pre-commit calls `claude -p "/simplify"` then `/anatomy refresh` for staged files; commit picks up wiki updates. |
| 12 | Wiki freshness gate | `python3 .claude/scripts/hooks.py check-anatomy-fresh` | Pre-push runs the same check; blocks push if stale. Bypass with `--no-verify`. |
| 13 | Orchestrator | type `/open-pr` | `/simplify` → `/security-review` → `gh pr create` → `/review` on the new PR. |
| 14 | Graphify | `/setup graphify` once, then ask Claude "use graphify to find all callers of `sanitizeInput`" | Token-efficient knowledge-graph queries over the codebase. |
| 15 | MCP | `.claude/settings.json` `mcpServers`; ask "fetch React 19 docs" | `context7` MCP wired per-project. |
| 16 | Plan mode | `Shift+Tab` then "add rate limiting middleware" | Plans persist to `./plans/`. |
| 17 | Local-LLM Stop hook | run `/setup llm` to wire ollama/LM Studio + a small model (e.g. `gemma4:e4b`); let conversation drift to a new topic | Stop hook prints `✨ conversation hygiene: consider /compact …` with a one-line reason from the local model. Token-gated so it doesn't run on every turn. |
| 18 | .claude tests | run `bash .claude/tests/run.sh` | Discovers `*_test.py` siblings under `.claude/` (e.g. `hooks_test.py`) and lists `*.eval.md` skill evals. |

---

## 1. Project Configuration (`CLAUDE.md` — Progressive Disclosure)

- `CLAUDE.md` at the repo root is always loaded.
- Subdirectory `CLAUDE.md` (e.g. `src/CLAUDE.md`, `tests/CLAUDE.md`) loads only when Claude works in that directory.
- Keeps context focused and token-efficient.

---

## 2. Settings (`settings.json` vs `settings.local.json`)

| Key | Purpose |
|---|---|
| `permissions.allow` / `ask` / `deny` | Pre-approve, prompt, or block tool patterns. |
| `env` | Env vars applied to every session. |
| `hooks` | Run shell commands or prompt-type evaluations on Claude events. |
| `mcpServers` | Project-level MCP servers (here: `context7`). |
| `statusLine` | Custom status bar above the prompt. |
| `attribution.commit` / `attribution.pr` | Default suffix on commits and PR bodies. |
| `plansDirectory` | Where `/plan` files are stored (here: `./plans`). |

Deprecated `ignorePaths` was replaced with `permissions.deny "Read(./.env)"` etc.

---

## 3. Rules Directory (`.claude/rules/`)

Always loaded, unlike `CLAUDE.md`. Use for cross-cutting concerns:

- `.claude/rules/security.md` — secret-handling, eval ban, input sanitisation.
- `.claude/rules/testing.md` — Node test runner, deterministic asserts.
- `.claude/rules/code-style.md` — CommonJS, 2-space, ≤30-line functions.

---

## 4. Hooks

Two distinct things. **Don't conflate them.**

### 4a. Claude Code hooks (in `.claude/settings.json`)

Run on Claude's tool/session events. Cannot directly invoke a slash command — they shell out to a command, send a prompt to a model, hit an HTTP endpoint, etc.

**One dispatcher, every event.** All `command`-type hooks route through `.claude/scripts/hooks.py <event> [check]`. The python file has a handler for every hook event Claude Code emits (PreToolUse, PostToolUse, Notification, UserPromptSubmit, Stop, SubagentStop, PreCompact, SessionStart, SessionEnd) — placeholders for events we don't currently use, real logic for the ones we do. New hooks land here, not in fresh files.

| Event | Matcher | Type | Handler | Behaviour |
|---|---|---|---|---|
| `PreToolUse` | `Edit\|Write` | `command` | `hooks.py pre-tool-use check-no-secrets` | Inspects `tool_input.content` *before* write. Exit 2 = block. |
| `PreToolUse` | `Glob\|Grep` | `command` | `hooks.py pre-tool-use graphify-hint` | Emits `additionalContext` nudging Claude to consult the graphify index. |
| `PostToolUse` | `Edit\|Write` | `command` | `hooks.py post-tool-use check-circular-deps` | DFS over `require()` graph from the touched file. Exit 2 = block. |
| `PostToolUse` | `Edit\|Write` | `command` | `hooks.py post-tool-use mark-anatomy-stale` | Appends `<!-- stale: <path> -->` marker to the wiki page for that area. Always exits 0. |
| `PostToolUse` | `Edit\|Write` | `command` | `hooks.py post-tool-use claude-review` | Shells out to `claude -p` for an LLM review. Same intent as the `prompt:` hook below; different mechanism. |
| `PostToolUse` | `Edit\|Write` | `prompt` | inline | LLM returns `{"decision":"block","reason":"..."}` on secret/eval finding. |
| `Stop` | — | `command` | `hooks.py stop` | Token-gated drift detector. Above `STOP_HOOK_DRIFT_GATE` (default 30%) it asks a *local* LLM (ollama or LM Studio, configured by `/setup`) whether to suggest `/compact` or `/clear`, then prints the verdict to stderr. Silent no-op when `LLM_BACKEND` is unset. |
| `SessionStart` | — | `command` | `hooks.py session-start` | Detects unsetup state (no `core.hooksPath`, no graphify index) and prints a one-liner reminder. |
| `Notification` / `UserPromptSubmit` / `SubagentStop` / `PreCompact` / `SessionEnd` | — | `command` | `hooks.py <event>` | Wired as placeholders so every event lands in one file. |

**Two ways to do the same thing — by design.** The `claude-review` command-hook and the `prompt:` hook on PostToolUse:Edit|Write both ask an LLM to flag secrets/eval. Use the `prompt:` form when you want the runtime to handle the call; use `claude -p` from a command-hook when you need full control (model, output-format, working dir, env, parsing the verdict yourself).

**Important matchers nuance:** `PreToolUse`/`PostToolUse` matchers match the *tool name* (`Bash`, `Edit|Write`, `mcp__.*`), **not** file paths. Path/folder filtering happens *inside* the script via `tool_input.file_path`. The only path-style matcher is `FileChanged`, and it's literal pipe-separated basenames — no globs.

**Stdin contract:** every hook receives JSON on stdin (`tool_name`, `tool_input`, `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`). The `prompt` type substitutes that JSON into `$ARGUMENTS`.

### 4b. Git hooks (in `.claude/scripts/git-hooks/`)

Run on `git commit` / `git push` regardless of who's driving. Wired via `git config core.hooksPath`.

| Hook | What it runs | Skip |
|---|---|---|
| `pre-commit` | `claude -p "/simplify"` on staged JS, then `claude -p "/anatomy refresh ..."` to update wiki, then `git add ANATOMY.md docs/wiki/` | `--no-verify` |
| `pre-push` | `python3 .claude/scripts/hooks.py check-anatomy-fresh` (blocks if stale), then `claude -p "/security-review"` | `--no-verify` |

### 4c. Tests for the hooks themselves (`.claude/tests/run.sh`)

Two distinct test surfaces in this repo:

| Surface | Lives in | Tests | Run via |
|---|---|---|---|
| **System code** | `tests/*.test.js` | The Node REST API (auth, cache, posts, rate-limit, users, utils) | `npm test` |
| **Claude scaffolding** | `*_test.py` siblings under `.claude/` | Hook scripts, helpers in `hooks.py`, future slash-command/skill evals | `bash .claude/tests/run.sh` |

Convention:
- **Unit tests as siblings.** A python script `foo.py` gets a `foo_test.py` next to it — co-located, easy to find, no path translation needed (the test imports `foo` directly).
- **Skill / agent / command evals as `<name>.eval.md`** next to the `.md` they exercise. The runner lists them but doesn't execute them — they're prompts, you run them with `claude -p "$(cat <evalfile>)"` when you want to evaluate.
- **`.claude/tests/run.sh`** discovers both and is the single entry point. CI-friendly (non-zero exit on failure).

Current scaffolding test: `.claude/tests/hooks_test.py` covers the Stop hook's pure helpers (token estimate, prompt build, verdict parse, excerpt budgeting against `LLM_CONTEXT_TOKENS`) and the end-to-end `stop()` flow with `_ask_local_llm` mocked. 21 tests, ~6 ms.

---

## 5. Custom Agents (`.claude/agents/`)

Markdown files defining specialised sub-agents (model, tools, system prompt). Useful for code review, test writing, API design, migrations.

Files: `.claude/agents/api-designer.md`, `.claude/agents/test-writer.md`.

---

## 6. Custom Slash Commands (`.claude/commands/`)

| Command | Purpose |
|---|---|
| `/setup [graphify]` | Wire git hooks, chmod scripts, optionally install graphify. Idempotent. Replaces `npm run setup`. |
| `/add-endpoint <name>` | Scaffold a route + model + test. |
| `/check-health` | Start the server and probe `/health`. |
| `/anatomy` | Generate or refresh the structured wiki (full / refresh / lint modes). |
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
| **Raw sources** | `src/`, `tests/` | Engineers |
| **The Wiki** | `ANATOMY.md`, `docs/wiki/<area>.md` | The LLM (kept in sync by hooks + `/anatomy`) |
| **The Schema** | `.claude/commands/anatomy.md`, `CLAUDE.md`, `.claude/rules/` | Team |

### What `/anatomy` produces

- **`ANATOMY.md`** — top-level index: file tree, area links, file counts, list of stale entries.
- **`docs/wiki/<area>.md`** — one page per area (`core`, `routes`, `services`, `middleware`, `models`, `utils`, `cache`, `db`, `tests`). Each page lists every file in the area with a short description, function list with one-liners, exports, and dependencies.
- **`docs/wiki/log.md`** — append-only log of ingest/refresh operations.

### Three modes

| Mode | Trigger | Effect |
|---|---|---|
| Full refresh | `/anatomy` | Walk all source, rewrite every wiki page from scratch. |
| Incremental | `/anatomy refresh <files>` | Update only the entries for those files. Used by pre-commit. |
| Lint | `/anatomy lint` | Read-only health check (orphan files, missing entries, contradictions). |

### How freshness is enforced

1. **`PostToolUse:Edit|Write` hook** marks the touched area page stale (`<!-- stale: src/foo/bar.js -->`).
2. **Pre-commit** runs `/anatomy refresh` for staged tracked files and `git add`s the wiki diff into the commit.
3. **Pre-push** runs `hooks.py check-anatomy-fresh`; any remaining `<!-- stale: ... -->` blocks the push with a copy-paste refresh command.

So the wiki cannot drift more than one commit behind the code, and only blocks at push time — the lowest-friction enforcement point.

### Demo

1. Run `/anatomy` to seed the wiki from the existing 40-file codebase.
2. Edit `src/utils/pagination.js` — watch `docs/wiki/utils.md` get a fresh `<!-- stale: ... -->` marker within seconds.
3. `git commit` — pre-commit refreshes the wiki and bundles it into the commit.
4. `git push` — would block if you skipped step 3 (`--no-verify` to bypass).

---

## 9. Graphify (knowledge-graph over the repo)

[Graphify](https://github.com/safishamsi/graphify) is a Claude-Code-native tool that converts a codebase (and docs/PDFs/images) into a queryable knowledge graph. Claude consults the graph instead of reading raw files for searches — significantly cheaper on large repos.

### Setup

Inside the Claude REPL:

```text
> /setup graphify
```

That runs `uv tool install graphifyy && graphify install && graphify claude install && graphify index .` (via [.claude/scripts/setup-graphify.sh](.claude/scripts/setup-graphify.sh)). Requires [uv](https://docs.astral.sh/uv/) on PATH.

### Demo

```text
> use graphify to list every callsite of sanitizeInput
> use graphify to show the dependency graph between services and routes
> use graphify to find files that import the rate-limit middleware
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
claude -p "/simplify Focus on these files: src/utils/pagination.js" --output-format text
echo "explain this error" | claude -p
```

### Plan mode

`Shift+Tab` toggles plan mode. Plans land in `./plans/`.

### Auto mode

```bash
claude --auto
claude --allowedTools "Edit,Write,Read,Bash(npm test)"
```

### Context mentions

`@file:src/services/auth.js`, `@url:...`, `@git:main..HEAD`.

---

## 12. Project File Tree

```
claude-demo/
├── CLAUDE.md
├── DEMO_GUIDE.md
├── ANATOMY.md                          ← LLM-owned; generated by /anatomy
├── package.json
├── plans/
├── docs/
│   └── wiki/                           ← LLM-owned per-area pages
│       ├── core.md   routes.md   services.md   middleware.md
│       ├── models.md utils.md   cache.md   db.md   tests.md
│       └── log.md                      ← append-only operation log
├── .claude/
│   ├── settings.json
│   ├── settings.local.json             ← gitignored
│   ├── rules/
│   ├── agents/
│   ├── commands/
│   │   ├── add-endpoint.md
│   │   ├── check-health.md
│   │   ├── anatomy.md                  ← LLM-wiki schema
│   │   └── open-pr.md
│   ├── skills/
│   └── scripts/                        # Claude-only scripts
│       ├── hooks.py                    # single dispatcher for every hook event
│       ├── statusline.sh
│       ├── setup-graphify.sh
│       └── git-hooks/
│           ├── pre-commit              # claude -p /simplify + /anatomy refresh
│           └── pre-push                # anatomy gate + claude -p /security-review
├── src/                                # ~40 files: blog/CMS REST API
│   ├── config.js   errors.js   server.js   router.js   index.js
│   ├── routes/     services/   middleware/   models/
│   ├── utils/      cache/      db/
└── tests/                              # node:test, 44 deterministic tests
```

---

## 13. Things That Look Real But Aren't

While preparing this repo we validated a popular third-party hooks README against the official docs. Beware:

- `$CLAUDE_FILE_PATH` env var — fabricated. File path comes from stdin JSON `tool_input.file_path`.
- `/advisor` slash command — not native and not on the official marketplace.
- `ignorePaths` in `settings.json` — deprecated; use `permissions.deny "Read(...)"`.

When you copy-paste from the internet, sanity-check against `https://code.claude.com/docs/en/hooks` and `https://code.claude.com/docs/en/settings`.

---

## 14. Bonus Topics

- **Memory system** — `~/.claude/projects/<repo>/memory/`.
- **Worktrees** — agents can work in isolated git worktrees.
- **Keybindings** — customise in `~/.claude/keybindings.json`.
- **`/cost`**, **`/compact`**, **`/init`**, **Esc** to interrupt, **Shift+Tab** for plan mode.
