# `.claude/` — the Claude Code config for this repo

This directory is **the demo**. The Next.js music looper at `apps/` is the
substrate Claude exercises; everything in `.claude/` is what the engineering
team is here to learn.

## Map

```
.claude/
├── settings.json         Hooks, permissions, env vars, MCP servers.
│                         Checked-in, applies to everyone using the repo.
├── settings.local.json   Per-user overrides. Gitignored. Holds dev-only
│                         secrets, LLM backend choice for the Stop hook,
│                         extra permission allows.
│
├── scripts/              See scripts/README.md.
│   ├── hooks.py          Single dispatcher for all hook events.
│   ├── statusline.sh     Custom statusline shown above the input box.
│   └── git-hooks/        pre-commit, pre-push wired via core.hooksPath.
│
├── tests/                See tests/README.md.
│   ├── hooks_test.py     35 specs for hooks.py — including the path
│   │                     mapping (area_for_path) that drives docs/wiki/.
│   └── run.sh            Test runner.
│
├── rules/                See rules/README.md.
│   ├── code-style.md     2-space, double quotes, const-by-default, etc.
│   ├── testing.md        Every route → test, deterministic data, etc.
│   ├── security.md       No hardcoded secrets, sanitise input, etc.
│   └── markdown.md       Markdown formatting conventions.
│
├── commands/             See commands/README.md.
│   ├── add-endpoint.md   /add-endpoint api|web <resource>
│   ├── anatomy.md        /anatomy refresh — regenerates docs/wiki
│   ├── check-health.md   /check-health — boots api, hits /health, kills it
│   ├── open-pr.md        /open-pr — clean, security-check, push, open PR
│   └── setup.md          /setup — wire git hooks, configure local LLM
│
├── agents/               See agents/README.md.
│   ├── api-designer.md   Designs REST endpoints
│   └── test-writer.md    Generates tests for existing code
│
├── skills/               See skills/README.md.
│   └── 20-questions/     Custom skill (asks 20 questions, narrows topic).
│
├── plans/                Plan-mode artefacts. The big one is
│                         the-project-itself-meaning-precious-valiant.md
│                         — the plan that drove this whole rewrite.
│
└── report/               Council review of this harness setup.
```

## What to read first

1. [`../CLAUDE.md`](../CLAUDE.md) — the top-level instructions Claude sees.
2. [`settings.json`](settings.json) — what's actually wired up.
3. [`scripts/hooks.py`](scripts/hooks.py) — the central dispatcher; every hook event lands here.
4. [`plans/the-project-itself-meaning-precious-valiant.md`](plans/the-project-itself-meaning-precious-valiant.md) — the plan that produced this codebase.
5. [`report/council-review.md`](report/council-review.md) — what 10 reviewers think of the harness setup.

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
   │                  check_uv_over_pip           │
   │    PostToolUse → mark_anatomy_stale,         │
   │                  claude_review (Opus -p),    │
   │                  check_circular_deps (off)   │
   │    Stop        → drift detection (local LLM) │
   │    SessionStart→ remind to /setup            │
   └──────────────────────────────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────────────┐
   │  Per-area wiki pages under docs/wiki/        │
   │  get stale-marked when their files change.   │
   │  /anatomy refresh regenerates them.          │
   └──────────────────────────────────────────────┘
```

## What ran during the rewrite

- `check_no_secrets` blocked a literal `password: "supersecret"` in a test fixture. ✓
- `mark_anatomy_stale` created stale-marker pages for `web-audio`, `web-pages`, `api-routes`, etc. ✓
- The first cut of `area_for_path` produced bogus pages (`web-tsconfig.json.md`, `api-server.ts.md`); fixed by gating on `len(parts) >= 4`. The hooks tests in `tests/hooks_test.py` lock that contract.
- Plan mode produced `plans/the-project-itself-meaning-precious-valiant.md`, which drove all 12 commits.
- Agent teams (spawned with `isolation: "worktree"`) were attempted; both teammates blocked on permission prompts and the work fell back to the main session. Documented in [`../STATUS.md`](../STATUS.md).
