# Benchmark v4 — Run Status

Run completed: 2026-05-08
Author: main session + 1 background C8 agent + 6 parallel council agents

## Done

| Item | Status | Output |
|------|--------|--------|
| /benchmark-setup readiness (jcodemunch / graphify / semble / index) | ✓ 4/4 | console |
| Step 3: behavioural oracles in SPEC.md | ✓ | `benchmark/SPEC.md` |
| T1 padnode_fadein × {C0, C3+filter, C3b, C8} | ✓ implemented + verified | `T1-*.md` |
| T2 engine_playing_count × 4 configs | ✓ | `T2-*.md` |
| T3 loop_tags × 4 configs | ✓ | `T3-*.md` |
| T4 loops_search × 4 configs | ✓ | `T4-*.md` |
| T5 effects_bypass × 4 configs | ✓ | `T5-*.md` |
| All 5 implementations: typecheck + tests + oracle | ✓ all pass | quality block per file |
| RESULTS.md aggregate | ✓ | `RESULTS.md` |
| S4 post-edit staleness scenario | ✓ key finding captured | `S4-post-edit-staleness.md` |
| 6-persona council (P1-P6) parallel | ✓ all returned | `COUNCIL-P{1-6}-*.md` |
| Council aggregation + ranked actions | ✓ | `COUNCIL.md` |
| COUNCIL-COSTS.md (council token tracking) | ✓ | `COUNCIL-COSTS.md` |
| cc-audit-tools sub-skill scaffold | ✓ | `.claude/skills/cc-audit-tools/SKILL.md` |
| SPEC oracle bugs fixed (engine.ts, effects.ts) | ✓ in commit | `benchmark/SPEC.md` |

## Deferred (handoff)

| Item | Why | Where to resume |
|------|-----|------------------|
| S1 staleness degradation curve | Needs a proper register_edit integration | next-cycle measurement |
| S2 long-session amortisation | Not in-session measurable | needs purpose-built run |
| S3 multi-session cold start | Requires real session restarts | manual user-driven |
| S5 3-session loop | Sub-agent proxy is too weak | `S5-multi-session-handoff.md` |
| C8 chunk granularity tuning | Wrong tool at this LOC | re-evaluate at >250k LOC |
| cc-audit-settings: jcodemunch MCP check | Covered by cc-audit-tools skill | next /cc-audit run will surface |
| `/anatomy refresh` | Heavy interactive op; unrelated to v4 deltas | run when convenient |
| `/cc-audit` re-run with new cc-audit-tools | Heavy parallel orchestration | run after this commit |

## Headline result

| Config | Total chars (T1-T5) | vs C0 | Quality |
|--------|---------------------|-------|---------|
| C0 baseline | 38,144 | — | ✓ |
| C3 jcodemunch + lang filter | 25,044 | **−34%** | ✓ |
| **C3b jcodemunch + direct fetch** | **21,524** | **−44%** | ✓ |
| C8 semble | 31,490 | −17% | ✓ |

**v4 ≥30% threshold: MET by C3 and C3b.** v4 is closed.

## Top-5 changes from council (next session)

1. **F1 staleness hook** (PostToolUse Edit|Write debounced re-index + pre-commit re-index)
2. **C3b default** in CLAUDE.md "Tool priority" (P2/P3/P4/P6 consensus)
3. **RESULTS dual-reporting** (chars with vs without CLAUDE.md auto-injection)
4. **Council-skip threshold** in `/benchmark-council` skill
5. **Pin uvx versions** in `/benchmark-setup` (P5 supply-chain risk)

## Files written this run

```
.claude/reports/benchmark-v4/
├── PLAN.md                 (already there; merged B+C scope)
├── RESULTS.md              (NEW — headline)
├── COUNCIL.md              (NEW — aggregated)
├── COUNCIL-COSTS.md        (NEW — token accounting)
├── COUNCIL-P1-cherney.md   (NEW)
├── COUNCIL-P2-karpathy.md  (NEW)
├── COUNCIL-P3-junior.md    (NEW)
├── COUNCIL-P4-senior.md    (NEW)
├── COUNCIL-P5-security.md  (NEW)
├── COUNCIL-P6-mlinfra.md   (NEW)
├── S4-post-edit-staleness.md   (NEW — key finding)
├── S5-multi-session-handoff.md (NEW — protocol for user)
├── STATUS.md                  (NEW — this file)
├── T1-C0-baseline.md          (NEW)
├── T1-C3-jcodemunch.md        (NEW)
├── T1-C3b-direct-fetch.md     (NEW)
├── T1-C8-semble.md            (NEW — by C8 sub-agent)
├── T2-* (4 files)              (NEW)
├── T3-* (4 files)              (NEW)
├── T4-* (4 files)              (NEW)
└── T5-* (4 files)              (NEW)

.claude/rules/
└── python-tooling.md       (NEW — uv-over-pip rule)

.claude/scripts/modules/
└── python_tooling.py       (NEW — PreToolUse hook, 10/10 cases)

.claude/skills/cc-audit-tools/
└── SKILL.md                (NEW — scaffolded from v4 findings)

.claude/scripts/
└── hooks.py                (MODIFIED — register python_tooling)

.claude/scripts/git-hooks/
└── pre-commit              (MODIFIED — fix npx --no → --no-install)

.claude/settings.json       (MODIFIED — wire check-uv-over-pip on Edit|Write|Bash)
.gitignore                  (MODIFIED — add semble-index.pkl, .venv-bench/)
.claude/commands/benchmark-setup.md  (MODIFIED — uv-only install)
.claude/reports/benchmark-v4/PLAN.md (MODIFIED — B+C merged scope)
.claude/reports/benchmark/SPEC.md    (MODIFIED — oracle paths fixed)
```

## Token spend estimate (this run)

| Phase | Tokens (approx) |
|-------|----------------:|
| Setup + commit + hook fixes | ~12,000 |
| T1-T5 main-session exploration + implementation + verify + revert | ~25,000 |
| C8 background sub-agent | 45,873 (reported) |
| Council 6 parallel sub-agents | 234,904 (reported) |
| Main session aggregation (RESULTS, COUNCIL, COUNCIL-COSTS, S4, S5, STATUS) | ~15,000 |
| **Total** | **~333,000** |

Council was **70%** of the spend. F6 from RESULTS predicted "council net-negative on
single run"; COUNCIL-COSTS confirmed it (56-cycle break-even).

**v4 was net-positive only because it identified architecture changes** (C1 staleness
hook, C2 C3b default) that pay back across all future agent sessions.
