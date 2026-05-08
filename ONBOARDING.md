# Claude Code Onboarding — Music Looper Demo

This repo is a browser-first music looping app. The app is the substrate. The **`.claude/` configuration** around it is what you're here to learn.

The pre-rewrite state (a blog/social API) lives at `git checkout pre-rewrite-snapshot`. The rewrite was done by Claude Code in a single session. Everything in `docs/wiki/`, `ANATOMY.md`, and the `.claude/` harness was produced or updated in that session. This document is the tour.

---

## Facilitator Runbook — 60-minute Workshop

Time markers are in `[brackets]`.

| Min | Section | What to show |
|---|---|---|
| `[0:00]` | Quickstart | Clone, `/setup`, open REPL |
| `[5:00]` | Narrative: pre-rewrite | `git log --oneline pre-rewrite-snapshot` vs `main` |
| `[10:00]` | `.claude/` tour | Walk the directory; explain each primitive |
| `[20:00]` | Hooks live demo | secrets gate, anatomy stale-marker, eslint check |
| `[30:00]` | Worked examples | `/advisor`, `/simplify`, `/review`, `/security-review` |
| `[40:00]` | Skills + commands | `/looper-add-effect`, `/anatomy`, `/open-pr` |
| `[50:00]` | Graphify + wiki | knowledge graph query, anatomy freshness gate |
| `[55:00]` | Lab exercises | Participants try: add `/looper-stats`, add an effect, run `/cc-audit` |

---

## Self-Paced Track — 90 minutes

Work through sections 1–10 at your own pace. Each section has an **action** you can run immediately.

---

## 0. Quickstart

```bash
git clone <repo> && cd claude-demo
pnpm install
```

Inside the Claude Code REPL:

```text
> /setup            # wires git hooks, chmods scripts
> /setup graphify   # optional: installs Graphify + indexes the repo
> /setup llm        # optional: configures local LLM for the Stop hook
```

To run the full app (web + api + localstack):

```bash
pnpm localstack:up      # DynamoDB Local (8000) + LocalStack S3 (4566)
pnpm localstack:seed    # creates tables, bucket, seeds test@test.com / testtest
pnpm dev                # web on :3000, api on :3001
```

The web studio works without the API — bundled synth samples play in the browser. The API is only needed for signup/login and loop persistence.

---

## 1. Narrative: What Did Claude Actually Do?

```bash
git log --oneline pre-rewrite-snapshot..HEAD | wc -l   # ~25 commits
git diff --stat pre-rewrite-snapshot HEAD | tail -5
git checkout pre-rewrite-snapshot   # look at the old blog/social API
git checkout main                   # back to the music looper
```

The entire rewrite — new app, full `.claude/` harness, 15 wiki pages, Graphify index, test suite — was produced by Claude Code. The `.claude/` config is not scaffolding; it was built as part of the work.

---

## 2. The `.claude/` Directory Map

```
.claude/
├── settings.json          ← hooks, permissions, env, statusLine, plansDirectory
├── settings.local.json    ← gitignored; your LLM backend, overrides
├── CLAUDE.md              ← project-level guidance always loaded
├── rules/                 ← cross-cutting rules, path-scoped via frontmatter
│   ├── security.md        ← global: no secrets, no eval
│   ├── code-style.md      ← global: 2-space, const, function size
│   ├── testing.md         ← global fallback (see area-specific below)
│   ├── testing-fastify.md ← paths: apps/api/tests/**
│   ├── testing-rtl.md     ← paths: apps/web/**/*.test.tsx
│   ├── frontend-component.md ← paths: apps/web/components/**/*.tsx
│   ├── fastify-route.md   ← paths: apps/api/src/routes/**/*.ts
│   └── markdown.md        ← paths: docs/**, *.md
├── commands/              ← slash commands: /setup, /anatomy, /open-pr …
├── skills/                ← project-specific skills: /looper-add-effect …
├── agents/                ← sub-agent definitions
├── plans/                 ← plan-mode artefacts (Shift+Tab)
├── scripts/
│   ├── hooks.py           ← single dispatcher for every hook event
│   ├── statusline.sh      ← status bar above the prompt
│   ├── setup-graphify.sh  ← graphify install script
│   └── git-hooks/         ← pre-commit, pre-push (wired via core.hooksPath)
├── tests/
│   ├── run.sh             ← single entry point: Python + shell tests
│   ├── hooks_test.py      ← 54 unit tests for hooks.py
│   └── test_audit_loop.sh ← integration test: mark-stale → check-fresh round trip
└── examples/
    └── expensive-hooks.json  ← opt-in config for per-edit LLM hooks
```

**Per-area CLAUDE.md files** add focused guidance for specific subsystems:

| File | What it adds |
|---|---|
| `apps/web/CLAUDE.md` | Next.js 15 conventions, Tailwind 4, audio pattern |
| `apps/web/lib/audio/CLAUDE.md` | AudioEngine as singleton, `setTargetAtTime`, PadNode→EffectsBus chain |
| `apps/api/CLAUDE.md` | Fastify conventions, presigned URL pattern |
| `apps/api/src/db/CLAUDE.md` | pk/sk shapes, GSI names, DDB_USE_STUB pattern |
| `apps/api/src/routes/CLAUDE.md` | Schema imports, HTTP status table, authGuard pattern |
| `packages/shared/CLAUDE.md` | Zod schema ownership |
| `infra/CLAUDE.md` | Terraform validate-only, localstack dev setup |

---

## 3. Settings and Permissions

Open `.claude/settings.json`. Key sections:

```json
{
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Bash(docker compose *)", ...],
    "ask":   ["Bash(git push *)", "Bash(rm *)"],
    "deny":  ["Bash(rm -rf *)", "Bash(git push --force*)", "Read(./.env)"]
  },
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "teammateMode": "auto"
  },
  "statusLine": { "type": "command", "command": "bash ...statusline.sh" },
  "plansDirectory": "./.claude/plans"
}
```

`settings.local.json` is gitignored — put per-machine overrides (LLM backend, API keys) there. Never commit it.

> **Teaching point:** `ignorePaths` is deprecated. Use `permissions.deny "Read(./.env*)"` instead.

---

## 4. Hooks — How the Harness Runs

All hooks route through **one dispatcher**: `.claude/scripts/hooks.py <event> [check]`. New hooks land there, not in separate scripts.

### Active hooks in `settings.json`

| Event | Matcher | Type | What it does | Cost |
|---|---|---|---|---|
| `PreToolUse` | `Edit\|Write` | command | `check-no-secrets` — regex for hardcoded secrets, eval(), new Function(); blocks with exit 2 | ~0 |
| `PreToolUse` | `Glob\|Grep` | command | `graphify-hint` — injects context nudge when `graphify-out/graph.json` exists | ~25 tokens |
| `PostToolUse` | `Edit\|Write` | command | `mark-anatomy-stale` — appends `<!-- stale: ... -->` to the wiki page for the edited area; async | ~0 |
| `PostToolUse` | `Edit\|Write` | command | `check-eslint-security` — runs `eslint-plugin-security` + `eslint-plugin-no-unsanitized` on `apps/web` .ts/.tsx files; async | ~0 |
| `Stop` | — | command | `stop` — token-gated drift detector via local LLM; suggests `/compact` or `/clear` | local LLM only |
| `Stop` | — | prompt | Task-completeness check — asks "did Claude complete the task?"; fires once per session | ~500 tokens |
| `SessionStart` | — | command | `session-start` — warns if git hooks not wired or graphify not indexed | ~0 |

### What was removed (and why)

`.claude/settings.json` has an `_examples` key that explains two expensive hooks that were removed from always-on config:

- **`prompt:` hook on `PostToolUse:Edit|Write`** — adds ~2500 tokens to the main context on *every* file edit. At scale, this doubles session cost.
- **`claude-review` command hook** — shells out to `claude -p` per edit, creating a *separate billable API call* on every write.

Both are documented in `.claude/examples/expensive-hooks.json` with embedding instructions for opt-in use in security-sensitive sessions.

### Exit-code gotcha

`exit 0` = success. **`exit 2` = block** (stderr printed to Claude). `exit 1` does NOT block — Unix convention is reversed here.

### The `prompt:` hook type

The Stop-event task-completeness hook is a `"type": "prompt"` hook. Instead of shelling out, the runtime feeds the hook's `prompt` string to the current model. `$ARGUMENTS` is substituted with the hook payload JSON. Low latency, no subprocess.

### Hooks you're NOT using yet (placeholders)

`Notification`, `UserPromptSubmit`, `SubagentStop`, `PreCompact`, `SessionEnd` all have no-op placeholders in `hooks.py`. This means new logic for any of these events has a home on day one.

---

## 5. Rules — Path-Scoped Conventions

Rules in `.claude/rules/` are loaded by Claude. With `paths:` frontmatter, each rule only applies when the active file matches:

```markdown
---
name: Fastify Route Rules
paths:
  - "apps/api/src/routes/**/*.ts"
---
- Import Zod schemas from @looper/shared ...
```

Without `paths:`, a rule is global. Current layout:

| Rule | Scope | Key constraint |
|---|---|---|
| `security.md` | global | No secrets, no eval(), validate at boundaries |
| `code-style.md` | global | 2-space, const, max 30-line functions |
| `testing.md` | global fallback | Specific assertions, no network calls |
| `testing-fastify.md` | `apps/api/tests/**` | Vitest + `app.inject()`, not supertest |
| `testing-rtl.md` | `apps/web/**/*.test.tsx` | RTL + `userEvent`, mock AudioContext |
| `frontend-component.md` | `apps/web/components/**` | Named export, aria-label, audio via hooks only |
| `fastify-route.md` | `apps/api/src/routes/**` | Schemas from `@looper/shared`, HTTP status table |
| `markdown.md` | `docs/**, *.md` | markdownlint, headings spacing |

**Rule → hook → CLAUDE.md progression:** a rule that's mechanically checkable should become a hook. `check-no-secrets` enforces `security.md`'s eval/secret rules deterministically at write time.

---

## 6. Worked Examples — Native Skills

These are all available in any Claude Code session, no install required.

### `/advisor` — before implementing a feature

Use `/advisor` when you're about to make a non-trivial decision and want an independent review of your approach.

```text
> I'm about to add a new reverb effect to EffectsRack.tsx. The plan is to
  add a new ConvolverNode in effects.ts, wire it into the master chain after
  the delay, expose a Slider in EffectsRack for mix level, and update
  EffectsParams in @looper/shared. Are there any gotchas I should know?

/advisor
```

The advisor sees your full conversation and tool call history. It won't repeat what you've already done — it looks for blind spots. Call it **before** writing, not after.

### `/simplify` — after writing code

Use `/simplify` after implementing a feature to catch duplication, awkward abstractions, and overly-long functions.

```text
> I've just added the new reverb effect. Please review what I wrote.

/simplify
```

In the pre-commit hook (earlier version), `/simplify` ran automatically on every staged file. That caused a loop — simplify modified the staged file, the next commit staged it again, and the hook ran again. **The fix: `/simplify` should be invoked manually or as part of `/open-pr`, not as an automatic transformation on every commit.**

### `/review` — before opening a PR

`/review` reads your current branch diff against main and gives a structured code review.

```text
/review
```

In this repo's `/open-pr` command, `/review` runs as a non-blocking **advisory** step. You see the findings; the command continues regardless. Only `/security-review` is blocking.

### `/security-review` — as part of pre-push

`/security-review` focuses specifically on security: secrets, injection, auth bypass, unsafe patterns.

```text
/security-review
```

The `pre-push` git hook runs it automatically:

```bash
# From .claude/scripts/git-hooks/pre-push
echo "[advisory] Running /review on diff range..."
claude -p "/review" ...   # non-blocking, output shown

echo "[blocking] Running /security-review on diff range..."
claude -p "/security-review" ...   # exits non-zero if findings
```

If `/security-review` finds something, the push is blocked. Fix the issue, then push again.

### When to use which

| Situation | Use |
|---|---|
| Starting a complex feature | `/advisor` first |
| After writing a chunk of code | `/simplify` |
| Before pushing / opening a PR | `/review` (advisory) + `/security-review` (blocking) |
| Automated on push | pre-push hook calls both |

---

## 7. Project Skills — Domain-Specific Guides

Skills are in `.claude/skills/<name>/SKILL.md`. They're procedural guides Claude follows when triggered.

| Skill | Trigger | What it does |
|---|---|---|
| `/looper-add-effect` | "add an effect", "add reverb/delay" | Guides through effects.ts → engine.ts → EffectsRack.tsx → shared types |
| `/write-vitest-test` | "write unit tests", "add tests for X" | Vitest tests for API/shared code via `app.inject()` |
| `/write-rtl-test` | "write component test" | RTL tests with audio mock, accessible queries |
| `/write-playwright-test` | "write E2E test", "add playwright test" | Behavioural (page.route stubs) or live (auth-live pattern) |
| `/write-api-route` | "add endpoint", "create route" | Full stack: schema → route → service → DB → test |
| `/write-component` | "create a component", "add UI" | Named export, props interface, aria, audio via hooks |

Skills compose: `/write-api-route` chains into `/write-vitest-test`; `/looper-add-effect` implicitly calls the pattern in `/write-component`.

> **Design principle:** skills are small single-responsibility units. An orchestrating skill (like "add a full feature") calls leaf skills in order. The rules and CLAUDE.md files carry conventions so skills don't duplicate them — they reference them.

---

## 8. The LLM Wiki + `/anatomy`

Implements the [Karpathy wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): a persistent, compounding artifact that an LLM owns and keeps in sync.

### Layers

| Layer | Where | Owner |
|---|---|---|
| Source files | `apps/`, `packages/`, `infra/` | Engineers |
| Wiki | `ANATOMY.md` + `docs/wiki/<area>.md` | Claude (via `/anatomy`) |
| Schema | `.claude/commands/anatomy.md`, `CLAUDE.md`, `rules/` | Team |

### Freshness cycle

1. You edit `apps/web/lib/audio/effects.ts`
2. `PostToolUse:mark-anatomy-stale` appends `<!-- stale: apps/web/lib/audio/effects.ts -->` to `docs/wiki/web-audio.md`
3. Pre-commit runs `/anatomy refresh apps/web/lib/audio/effects.ts`, rewrites that entry, `git add`s the diff
4. Pre-push runs `python3 .claude/scripts/hooks.py check-anatomy-fresh` — blocks if any stale markers remain

Verify the full round trip:

```bash
bash .claude/tests/test_audit_loop.sh
```

This integration test simulates a PostToolUse payload, asserts the stale marker appears, verifies the gate exits 1, cleans up, and asserts gate exits 0.

### Modes

```text
> /anatomy                              # full refresh — rewrites every wiki page
> /anatomy refresh apps/web/lib/audio/ # incremental — update only affected pages
> /anatomy lint                         # read-only health check (orphans, contradictions)
```

---

## 9. Graphify — Knowledge Graph

[Graphify](https://github.com/safishamsi/graphify) converts the repo into a queryable knowledge graph. Claude reads the graph instead of raw file searches — significantly cheaper on large repos.

```text
> /setup graphify
```

After indexing:

```text
> use graphify to list every callsite of getPresignedPutUrl
> use graphify to show what imports @looper/shared
> use graphify to find the dependency path between engine.ts and EffectsRack.tsx
```

The `PreToolUse:Glob|Grep` hook injects a nudge ("graphify index exists — consult it first") when `graphify-out/graph.json` is present.

**Graphify vs `/anatomy`:** Graphify answers "where is X used?" (structural). Anatomy answers "what is X for?" (intent). Use them together.

---

## 10. Plans, Agent Teams, and Memory

### Plan mode (`Shift+Tab`)

Toggles plan-review mode. Claude proposes a plan before executing; you approve or redirect. Plans persist to `.claude/plans/` so they survive session compaction.

```text
Shift+Tab → "add a /sessions route to persist pad config across reloads"
```

### Agent teams

Enabled via `settings.json` env `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

```python
Agent({
  team_name: "music-looper-build",
  name: "api-engineer",
  subagent_type: "general-purpose",
  isolation: "worktree",     # each agent gets its own git worktree
  prompt: "Implement POST /sessions ..."
})
```

**Real failure mode from this project:** agents waiting on permission prompts go idle; queued `SendMessage` calls aren't delivered until the agent unblocks. Fix: pre-approve permissions in `permissions.allow`, or use `bypassPermissions` mode for trusted agents.

Independent tasks (bug fixes, rule files, skills, CLAUDE.md additions) parallelize well. Sequential tasks (B1 → B2 where B2 depends on B1's hooks.py changes) don't.

### Memory (`/remember`)

```text
> /remember the auth cookie name is looper_auth and it's httpOnly
```

Saves to `.claude/memory/` (committed, team-shared) or `~/.claude/projects/<repo>/memory/` (user-local). The `project-memory` skill handles writes. The `SessionStart` hook loads the memory index into context.

---

## 11. The `/open-pr` Flow

The `/open-pr` command bundles a full pre-push review pipeline:

1. `pnpm typecheck && pnpm test` — types + unit tests pass
2. `pnpm e2e` — Playwright behavioural specs pass
3. `/review` on the diff — **advisory** (shown, non-blocking)
4. `/security-review` on the diff — **blocking** (halts if findings)
5. `python3 .claude/scripts/hooks.py check-anatomy-fresh` — **blocking** (halts if stale wiki)
6. `git push` + `gh pr create`

The separation of advisory vs blocking is intentional: `/review` might flag style preferences you disagree with; `/security-review` findings are not optional.

---

## 12. Git Hooks

Wired via `git config core.hooksPath .claude/scripts/git-hooks` (set by `/setup`).

### `pre-commit`

```bash
# 1. Find staged .ts/.tsx/.js/.mjs files matching apps/ or packages/
# 2. [blocking]  Complexity gate: run eslint with eslint-plugin-sonarjs +
#                built-in `complexity` rule on staged apps/web files.
#                Cyclomatic ≤ 10, cognitive ≤ 15. Fails commit on violation.
# 3. Run /anatomy refresh on them (incremental wiki update)
# 4. git add ANATOMY.md docs/wiki/ so the wiki diff lands in this commit
```

No `/simplify` — removed because it modified staged files and caused a re-run loop on the next commit.

The complexity gate runs **pre-commit only**, not on every Edit/Write. The agent stays unblocked during writes; drift gets caught at commit time. Config: `apps/web/eslint.complexity.config.js`. Skipped with a notice if `eslint-plugin-sonarjs` isn't installed (run `pnpm install`).

### `pre-push`

```bash
# 1. [advisory]  claude -p "/review" on the diff range   — output shown, no block
# 2. [blocking]  claude -p "/security-review" on diff    — exit non-zero = push blocked
# 3. [blocking]  check-anatomy-fresh                     — stale wiki = push blocked
```

Skip with `git push --no-verify` when the CLI isn't available (CI, offline).

---

## 13. Test Surfaces

| Surface | Location | Runner | Count |
|---|---|---|---|
| App unit tests | `apps/api/tests/`, `packages/shared/` | `pnpm test` (Vitest) | 54 specs |
| Component tests | `apps/web/components/**/*.test.tsx` | `pnpm test` (Vitest + RTL) | — |
| Playwright behavioural | `apps/web/e2e/*.spec.ts` | `pnpm e2e` | 12 specs |
| Visual regression | `apps/web/e2e/visual-tour.spec.ts` | `pnpm e2e:visual` | 12 screenshots |
| Hook unit tests | `.claude/tests/hooks_test.py` | `bash .claude/tests/run.sh` | 54 tests |
| Hook integration test | `.claude/tests/test_audit_loop.sh` | `bash .claude/tests/run.sh` | 1 test |

Run everything:

```bash
pnpm typecheck
pnpm test
bash .claude/tests/run.sh
```

---

## 14. `/cc-audit` and `/cc-scaffold` — Config Audit + Workflow Scaffolder

Both skills live in this repo at `.claude/skills/cc-audit/` and
`.claude/skills/cc-scaffold/`. The repo is the source of truth for the
patterns and the demo of them in action; future plugin packaging is a
separate concern.

### `/cc-audit` — structural baseline

Audits any repo's `.claude/` against a strict baseline (settings shape,
hook layout, security guards, rules, monorepo signals).

```text
> /cc-audit              # plan only
> /cc-audit --dry-run    # show diff, no writes
> /cc-audit --apply      # scaffold with confirmation
```

Fan-out: 9 parallel sub-skills (`cc-audit-{settings,permissions,security,claude-md,skills,hooks,git-hooks,enterprise,monorepo}`) emit structured Finding JSON, which the orchestrator merges and runs through a 6-persona council review before emitting a plan-mode diff bundle.

Recent additions: a hook-layout drift detector (flags monolithic
`hooks.py` with no `modules/` split), a Stop-hook re-entry-loop
detector (flags `prompt`-type Stop hooks that don't honor
`stop_hook_active`), a complexity-gate detector, and 5 workflow-surface
detectors that route to `/cc-scaffold` for remediation.

### `/cc-scaffold` — research-driven workflow surface

Companion skill. Where `cc-audit` enforces structure, `cc-scaffold`
adds the opinionated workflow surface this repo demonstrates:
project-memory, `/anatomy` + `docs/wiki/`, `write-*` skills, `/open-pr`,
`/check-health`, named subagents, and the complexity / maintainability
gate.

```text
> /cc-scaffold                              # plan only, all clusters
> /cc-scaffold --cluster=memory             # only project-memory
> /cc-scaffold --cluster=complexity --apply # research stack, wire gate
```

Templates ship stack-agnostic — every concrete tool choice (eslint
plugin, test runner, schema lib, complexity rule) is researched at
apply time via `context7` + `WebSearch` in parallel, so the scaffold
picks current-best rather than shipping stale plugin names. See
`.claude/memory/decision_research_driven_scaffold.md` for the why.

### Smoke tests you can run yourself

These are the things to try after first install — each one validates a
different layer of the harness end-to-end.

**Smoke test A — complexity gate blocks a bad commit**

```bash
cd apps/web
cat > /tmp/messy.ts <<'EOF'
export function tangled(n: number, x?: string, y?: string, z?: string) {
  if (n > 0) { if (x) { if (y) { if (z) {
    if (n === 1) return "a"; if (n === 2) return "b";
    if (n === 3) return "c"; if (n === 4) return "d";
    if (n === 5) return "e"; if (n === 6) return "f";
    if (n === 7) return "g"; if (n === 8) return "h";
  } } } }
  return "";
}
EOF
mv /tmp/messy.ts components/Messy.ts
git add components/Messy.ts
git commit -m "test"   # → expect: pre-commit FAILS with complexity violation
git restore --staged components/Messy.ts && rm components/Messy.ts
```

**Smoke test B — `/cc-audit` self-audit**

```text
> /cc-audit
```

Expect: a plan-mode bundle. Real findings on this repo (intentionally
left so the audit has something to surface). The 5 workflow-surface
detectors should emit zero findings (this repo has the patterns).

**Smoke test C — `/cc-scaffold` against a throwaway**

```bash
cd /tmp && mkdir scaffold-test && cd scaffold-test
git init -q
echo '{"name":"toy","scripts":{"test":"node --test"}}' > package.json
```

Then in Claude Code, `cd` into `/tmp/scaffold-test` and run:

```text
> /cc-scaffold --dry-run
```

Expect: the agent detects the stack (Node, no framework), researches
current best-practice, and proposes file additions for each cluster.
It should not write anything in `--dry-run`.

**Smoke test D — `bootstrap.sh` dry-run**

```bash
cd /tmp/scaffold-test
bash /path/to/claude-demo/.claude/skills/cc-audit/bootstrap.sh --dry-run --cluster=settings .
```

Expect: a plan listing every file that would be staged, including the
`modules/` skeleton (`__init__.py`, `common.py`, `secrets.py`,
`security.py`, `pii.py`, `lifecycle.py`, `stop.py`).

---

## 15. Things That Look Real But Aren't

Copied from third-party docs and stack overflow, these are wrong:

| Claim | Reality |
|---|---|
| `$CLAUDE_FILE_PATH` env var in hooks | Doesn't exist. Use stdin JSON `tool_input.file_path`. |
| `ignorePaths` in settings.json | Deprecated. Use `permissions.deny "Read(...)"`. |
| Hook `exit 1` blocks | It doesn't. Only `exit 2` blocks. |
| `forceLoginMethod: ["claudeai"]` array | Fails silently. It's a string, not an array. |

Check [claude.ai/code/docs](https://claude.ai/code) for the authoritative reference.

---

## 16. Lab Exercises

Do these in the REPL after the tour.

### Lab 1 — Add a `/looper-stats` slash command

Paste this into Claude:

```text
Create a new slash command at .claude/commands/looper-stats.md that, when
invoked, counts the number of .ts/.tsx files in apps/web and apps/api, runs
pnpm test and reports pass/fail, and prints the number of stale wiki entries
from hooks.py check-anatomy-fresh. Format output as a 3-line status card.
```

Then type `/looper-stats` to run it.

### Lab 2 — Add a new audio effect

```text
/looper-add-effect

Add a stereo chorus effect with rate (Hz) and depth parameters.
```

The skill guides you through the complete change: `effects.ts` → `engine.ts` → `EffectsRack.tsx` → `@looper/shared` types.

### Lab 3 — Audit + scaffold tour

Run the four smoke tests in Section 14 in order:

1. **Complexity gate (A)** — write a deliberately complex function in
   `apps/web/components/`, try to commit it, watch the pre-commit hook
   block. Roll back and refactor if you want; otherwise discard.
2. **`/cc-audit` (B)** — invoke against this repo. Read the findings.
   They're real; the repo intentionally leaves some things for
   `cc-audit` to surface.
3. **`/cc-scaffold --dry-run` (C)** — invoke against an empty
   `/tmp/scaffold-test` repo. Watch the agent detect the stack,
   dispatch context7 + WebSearch in parallel, reconcile, and propose.
4. **`bootstrap.sh --dry-run` (D)** — verify the templates stage the
   modular hooks layout including every module skeleton.

The four together exercise structural audit, research-driven
scaffolding, the bootstrap pipeline, and the maintainability gate —
the four layers of the harness this repo demonstrates.
