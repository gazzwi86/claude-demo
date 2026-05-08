---
name: cc-scaffold
description: Research-driven workflow scaffolder for Claude Code. Detects the project's stack, researches current best-practice for that stack via context7 and WebSearch in parallel, and scaffolds project-memory, /anatomy + docs/wiki, write-ui / write-api / write-test skill skeletons, /open-pr / /check-health workflow commands, and api-designer / test-writer subagents. Use when the user invokes /cc-scaffold, asks to "scaffold the workflow surface", "set up project memory", "add /anatomy", or "research best-practice scaffolding for this stack". Companion to cc-audit — cc-audit handles structural baseline (settings, hooks, rules, security guards); cc-scaffold handles opinionated workflow patterns and stack-aware tool choices.
when_to_use: User runs /cc-scaffold, asks for stack-aware workflow scaffolding (project-memory, /anatomy, write-* skills, /open-pr, /check-health, agents), or wants the demo-driven patterns from this repo lifted into another repo.
argument-hint: "[--cluster=memory|wiki|skills|commands|agents] [--dry-run] [--apply]"
allowed-tools: ["Read", "Glob", "Grep", "Bash", "Write", "Edit", "AskUserQuestion", "WebSearch", "WebFetch"]
---

# cc-scaffold — research-driven workflow scaffolder

Companion skill to `cc-audit`. Where `cc-audit` enforces a structural
baseline (settings shape, hook layout, rules, security guards),
`cc-scaffold` adds the opinionated workflow surface this repo
demonstrates: project memory, regenerated wiki, write-* helper skills,
PR / health workflow commands, and named subagents.

## What it scaffolds

Each cluster is independent and opt-in via per-cluster confirmation.

| Cluster | What it adds |
|---|---|
| `memory` | `.claude/skills/project-memory/SKILL.md`, `.claude/memory/MEMORY.md`, `.claude/commands/remember.md`, hook nudge in `modules/memory.py`. |
| `wiki` | `.claude/commands/anatomy.md`, `.claude/scripts/modules/wiki.py`, empty `docs/wiki/`, top-level `ANATOMY.md` skeleton. |
| `skills` | Stack-aware skeletons under `.claude/skills/`: `write-ui`, `write-api`, `write-test`. Frontmatter + body shaped by detected stack. |
| `commands` | `.claude/commands/open-pr.md`, `.claude/commands/check-health.md`. |
| `agents` | `.claude/agents/api-designer.md`, `.claude/agents/test-writer.md`. |

## 5-step orchestration flow

### 1. Detect the stack

Read manifest files at the repo root and one level deep:

- `package.json` (Node — pull `dependencies`, `devDependencies`, `scripts`)
- `pyproject.toml` / `requirements.txt` / `setup.py` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- `Gemfile` (Ruby)
- `composer.json` (PHP)
- `pom.xml` / `build.gradle*` (JVM)
- `*.csproj` (.NET)

For a JS/TS project, also note: framework signals (`next`, `vite`,
`fastify`, `express`, `hono`, `react`, `vue`, `svelte`, `solid`),
test runners (`vitest`, `jest`, `node:test`, `playwright`), and
type system (`typescript`, `flow`, neither).

Record findings as a structured `stack` object — language, frameworks,
test runners, build tools, package manager.

### 2. Research current best-practice (parallel)

For each scaffold target, dispatch `context7` and `WebSearch` in
parallel and reconcile:

- **context7**: `resolve-library-id` for known libraries in the stack
  (`@anthropic-ai/sdk` → resolve, then `query-docs` for setup), then
  pull current docs for the chosen tooling.
- **WebSearch**: search `"<stack> <topic> best practice 2026"` for the
  topic at hand (e.g. `"react component testing best practice 2026"`,
  `"python uv vs pip 2026"`, `"typescript eslint complexity plugin"`).

The agent reconciles: prefer authoritative sources (official docs via
context7) over blog posts, but use search hits to surface plugins or
tools that may not have docs in context7 yet. Capture decisions in a
`research-notes.md` file under `.claude/reports/cc-scaffold/`.

Topics to research per cluster:

- **skills/write-ui**: current component conventions, accessibility
  guidance, styling system, prop validation idiom.
- **skills/write-api**: route handler shape, schema validation,
  error handling, rate limiting.
- **skills/write-test**: test runner, assertion library, structure
  conventions, mocking idiom for the chosen stack.
- **memory**: nothing stack-dependent; ship the skeleton verbatim.
- **wiki**: per-area mapping rules — read the repo layout and propose
  area-for-path mapping.
- **commands**: PR workflow tools (gh / lab / etc), health-check
  endpoint conventions for the detected framework.
- **agents**: nothing stack-dependent; ship verbatim.

### 3. Propose

For each cluster, produce a Finding with:

- The files to create, with rendered content (placeholders filled
  from research).
- Citations: which context7 doc, which search result drove each
  non-trivial decision.
- A 1-line rationale.

Emit findings JSON to `.claude/reports/cc-scaffold/findings.json`.

### 4. Plan-mode bundle

Aggregate findings into a plan-mode diff bundle. Group by cluster.
Show the user every new file's full path + size + a 3-line excerpt.

### 5. Apply (if --apply)

Per-cluster `[y/N]`. On `y`, write the files. On `n`, skip the
cluster but persist the proposal under
`.claude/reports/cc-scaffold/skipped/` so the user can revisit.

## Templates

Skeletons live under `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-scaffold/templates/`:

- `skills/project-memory/SKILL.md`
- `skills/write-ui/SKILL.md`
- `skills/write-api/SKILL.md`
- `skills/write-test/SKILL.md`
- `commands/{remember,anatomy,open-pr,check-health}.md`
- `agents/{api-designer,test-writer}.md`
- `memory/MEMORY.md` (empty index header)

Skeletons use `{{PLACEHOLDER}}` markers that the agent fills from
research output.

## What this skill DOES NOT do

- It does not edit `.claude/settings.json`, `hooks.py`, or rules.
  Those are owned by `cc-audit`.
- It does not enforce maintainability / complexity gates. Phase F of
  the cc-audit refresh adds a complexity-gate cluster to cc-audit.
- It does not write code in `apps/`, `src/`, or any application
  directory. It only adds files under `.claude/`, `docs/wiki/`, and
  `ANATOMY.md`.

## Self-modification guard

Like `cc-audit`, the orchestrator never edits `settings.json` or
`hooks.py` directly — only files under `.claude/skills/`,
`.claude/commands/`, `.claude/agents/`, `.claude/memory/`, `docs/wiki/`,
and the top-level `ANATOMY.md` placeholder.
