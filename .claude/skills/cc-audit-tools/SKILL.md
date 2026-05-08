---
name: cc-audit-tools
description: Audits code-navigation tooling (jcodemunch MCP, graphify graph.json, semble vector index). Checks registration, version pinning, index freshness, gitignore hygiene, and CLAUDE.md "Tool priority" section. Returns Finding JSON for the cc-audit orchestrator. Use when the user invokes /cc-audit, asks to "audit code-navigation tools", "check jcodemunch / graphify / semble setup", or "review tool freshness". - Orchestrator fan-out for /cc-audit, or a direct request to audit the navigation-tool stack.
type: subskill
parent: cc-audit
---

# cc-audit-tools

Audits the code-navigation tool stack. Sister skill to cc-audit-settings (settings shape) and cc-audit-permissions (allow/ask/deny). This skill owns *navigation tooling correctness*.

Created from v4 benchmark findings (`.claude/reports/benchmark-v4/COUNCIL.md`).

## Checks

### T1 — jcodemunch MCP

| Check | Pass criteria | Fix |
|-------|--------------|-----|
| Registered | `claude mcp list` shows jcodemunch as Connected | `claude mcp add --scope project jcodemunch uvx jcodemunch-mcp@<pinned>` |
| Version pinned | `mcp.servers.jcodemunch.command` includes `@<version>` | Pin to current; security/P5 finding |
| Indexed | `~/.code-index/<repo>-*.db` exists; symbol_count > 1,000 | `index_folder { incremental: true }` |
| Index fresh | mtime within 24h; or all tracked source files older than mtime | `index_folder { incremental: true }` |
| Hooks wired | PostToolUse Edit\|Write triggers debounced re-index | Add hook to `.claude/settings.json` (see C1 in COUNCIL.md) |

Finding emitted on staleness:
```json
{
  "id": "tools-jcodemunch-stale",
  "severity": "warn",
  "area": "tools",
  "message": "jcodemunch index is N commits behind HEAD. C3 results may include stale symbol bodies.",
  "fix": "Run mcp__jcodemunch__index_folder { incremental: true }, or wire the staleness PostToolUse hook."
}
```

### T2 — graphify graph.json

| Check | Pass criteria | Fix |
|-------|--------------|-----|
| graph.json present | `graphify-out/graph.json` exists | `graphify index .` |
| node count sane | `nodes >= 100` for non-trivial repos | Re-index |
| Gitignored | `graph.json` and `cache/` in `.gitignore` | Add entries |
| GRAPH_REPORT.md gitignored | (not committed) | Add to `.gitignore` |
| SKILL.md uses targeted queries | `.claude/skills/graphify/SKILL.md` mentions `node -e` or `jq` query pattern, NOT "Read GRAPH_REPORT.md" | Rewrite per benchmark v3 fix |

### T3 — semble (optional, only if C8 enabled)

| Check | Pass criteria | Fix |
|-------|--------------|-----|
| Installed via uv | `.venv-bench/bin/python -c 'import semble'` succeeds | `uv venv .venv-bench && uv pip install --python .venv-bench/bin/python semble` |
| Index built | `graphify-out/semble-index.pkl` exists | rebuild |
| Pickle gitignored | `*.pkl` in gitignore | add — P5 RCE risk |
| Pickle not in CI cache | check CI artifacts don't include `.pkl` | exclude — P5 RCE risk |
| Recommendation present | docs/CLAUDE.md notes semble is for >250k LOC repos | add per F5/P6 |

### T4 — CLAUDE.md "Tool priority" wired

| Check | Pass criteria | Fix |
|-------|--------------|-----|
| Section exists | top-level `CLAUDE.md` has a "Navigation" or "Tool priority" section | scaffold |
| Order matches benchmark | C3b (direct fetch) listed before C3 (search) before C0 (Read) | rewrite per COUNCIL.md C2 |
| Fallback documented | "if symbol_id miss, fall back to search; if file is small, prefer Read" | per P3 simplification |

### T5 — Re-index hook present

| Check | Pass criteria | Fix |
|-------|--------------|-----|
| PostToolUse Edit\|Write debounced re-index | `.claude/settings.json` hooks fire `index_folder { incremental: true }` after Edit/Write idle | add hook |
| Pre-commit re-index | `.claude/scripts/git-hooks/pre-commit` calls index_folder on tracked source paths | add step |
| `_freshness` check wrapper | get_symbol_source results are checked for `_freshness == "stale_index"` before trust | wrap MCP call sites |

## Output (Finding JSON list)

Each check emits zero or more Finding objects:

```typescript
type Finding = {
  id: string;          // "tools-<area>-<topic>"
  severity: "info" | "warn" | "error";
  area: "tools";
  message: string;
  fix: string;         // exact remediation command or file edit
  evidence?: string;   // file path or output snippet
}
```

Aggregator in `cc-audit/SKILL.md` collects findings from all sub-skills and renders
them as the unified plan-mode diff bundle.

## Why this skill exists (provenance)

Benchmark v4 (`.claude/reports/benchmark-v4/`) found:

- F1: `_freshness: stale_index` is a load-bearing signal, never enforced
- F3: C3b > C3 because direct-fetch beats search when symbol_id is guessable
- F5: semble at <100k LOC has wrong granularity
- C1 (council): re-index hook is the highest-ROI change
- P5 (security): pickle persistence + unpinned uvx are real risks

This skill encodes those findings as a deterministic audit step so future repos
get the lessons applied automatically via `/cc-audit`.
