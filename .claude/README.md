# `.claude/` — the Claude Code config for this repo

This directory is **the demo**. The Next.js music looper at `apps/` is the
substrate Claude exercises; everything in `.claude/` is what the engineering
team is here to learn.

## Map

```
.claude/
├── settings.json         Hooks, permissions, env vars, MCP servers, statusLine,
│                         plansDirectory. Checked-in, applies to everyone.
├── settings.local.json   Per-user overrides. Gitignored. Per-machine secrets,
│                         LLM backend choice for the Stop hook, extra allows.
│
├── scripts/              See scripts/README.md.
│   ├── hooks.py          Single dispatcher for all hook events.
│   ├── modules/          Per-concern split: secrets, security, pii, lifecycle, stop, …
│   ├── statusline.sh     Custom statusline shown above the input box.
│   ├── setup-graphify.sh Installs the graphify knowledge graph (optional).
│   └── git-hooks/        pre-commit, pre-push wired via core.hooksPath.
│
├── tests/                See tests/README.md.
│   ├── hooks_test.py     76 unit tests for hooks.py (incl. area_for_path mapping).
│   ├── test_audit_loop.sh Integration test: mark-stale → check-fresh round trip.
│   └── run.sh            Single entry point. Asserts ≥35 tests run.
│
├── rules/                See rules/README.md.
│   ├── code-style.md     Global. 2-space, double quotes, const-by-default.
│   ├── security.md       Global. No hardcoded secrets, no eval, sanitise input.
│   ├── testing.md        Global fallback. Specific assertions, no network.
│   ├── markdown.md       paths: docs/**, *.md.
│   ├── python-tooling.md uv only — no pip. Enforced by hook.
│   ├── testing-fastify.md  paths: apps/api/tests/**.
│   ├── testing-rtl.md      paths: apps/web/**/*.test.tsx.
│   ├── frontend-component.md paths: apps/web/components/**.
│   └── fastify-route.md    paths: apps/api/src/routes/**.
│
├── commands/             See commands/README.md.
│   ├── add-endpoint.md   /add-endpoint api|web <resource>
│   ├── anatomy.md        /anatomy refresh — regenerates docs/wiki
│   ├── cc-audit.md       /cc-audit — strict-by-default audit + scaffolder
│   ├── cc-scaffold.md    /cc-scaffold — research-driven workflow scaffolder
│   ├── check-health.md   /check-health — boots api, hits /health, kills it
│   ├── open-pr.md        /open-pr — review pipeline + push + open PR
│   ├── remember.md       /remember — save fact to project or user memory
│   └── setup.md          /setup — wire git hooks, configure local LLM
│
├── agents/               See agents/README.md.
│   ├── api-designer.md   Designs REST endpoints
│   └── test-writer.md    Generates tests for existing code
│
├── skills/               See skills/README.md.
│   ├── looper-add-effect/  Project skill: extend the Web Audio chain.
│   ├── write-{api-route,component,vitest-test,rtl-test,playwright-test}/
│   │                       Stack-aware "how to add an X" guides.
│   ├── project-memory/     Routes /remember to project- vs user-level memory.
│   ├── cc-audit/ + cc-audit-<area>/ × 10
│   │                       Strict-by-default .claude/ audit; fan-out + council.
│   └── cc-scaffold/        Companion to cc-audit; researches stack + scaffolds.
│
├── memory/               Team-shared, committed-to-git project memory.
│   └── MEMORY.md         Index of facts (decisions, conventions, references).
│
├── reports/              Living documents only.
│   └── BENCHMARK.md      Tool-comparison decisions (jcodemunch/graphify/anatomy).
│
├── plans/                Plan-mode artefacts. Dir tracked via .gitkeep;
│                         individual plan files gitignored (per-developer).
│
└── examples/
    └── expensive-hooks.json  Opt-in config for per-edit LLM hooks.
```

## What to read first

1. [`../CLAUDE.md`](../CLAUDE.md) — top-level instructions Claude sees on every turn.
2. [`../ONBOARDING.md`](../ONBOARDING.md) — the workshop runbook; the canonical tour.
3. [`settings.json`](settings.json) — what's actually wired up.
4. [`scripts/hooks.py`](scripts/hooks.py) — the central dispatcher; every hook event lands here.
5. [`reports/BENCHMARK.md`](reports/BENCHMARK.md) — why we picked jcodemunch over graphify/semble.

## How the pieces connect

```
                    ┌────────────────────────┐
                    │  Claude reads these on │
                    │      every turn        │
                    └────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   CLAUDE.md           rules/*.md           ANATOMY.md + docs/wiki/
   (top level +       (cross-cutting       (LLM-maintained map of
    per-package)      conventions)          source files)

                  ▼
   ┌──────────────────────────────────────────────┐
   │  When Claude calls a tool, settings.json     │
   │  hooks fire — Pre/PostToolUse:Edit|Write     │
   │  pipe through scripts/hooks.py:              │
   │                                              │
   │    PreToolUse  → check_no_secrets,           │
   │                  graphify_hint,              │
   │                  python_tooling (uv only)    │
   │    PostToolUse → mark_anatomy_stale,         │
   │                  check_eslint_security       │
   │    Stop        → drift detector (local LLM), │
   │                  task-completeness (prompt)  │
   │    SessionStart→ memory loader, /setup nudge │
   │    UserPromptSubmit → memory save-trigger    │
   └──────────────────────────────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────────────┐
   │  Per-area wiki pages under docs/wiki/        │
   │  get stale-marked when their files change.   │
   │  pre-commit runs /anatomy refresh; pre-push  │
   │  blocks if any stale markers remain.         │
   └──────────────────────────────────────────────┘
```

## Demo highlights

- `check_no_secrets` blocks literal passwords/tokens at write time (`exit 2`).
- `mark_anatomy_stale` writes `<!-- stale: ... -->` into the affected wiki page; `pre-commit` runs `/anatomy refresh` to regenerate.
- `python_tooling` deny-lists `pip`/`pip3` patterns at PreToolUse — uv only.
- `cc-audit` self-audits this repo's config; `cc-scaffold` researches and scaffolds the same patterns into other repos.
- The hook tests in `tests/hooks_test.py` lock the `area_for_path` contract that drives `docs/wiki/` regeneration.
