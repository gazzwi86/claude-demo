---
name: benchmark-setup
description: Verify and configure the tool-comparison benchmark stack (jcodemunch, graphify, semble). Run before /benchmark-council to ensure all tools are indexed and ready.
---

# /benchmark-setup

**Invoke:** type `/benchmark-setup` in any Claude Code session before running `/benchmark-council`.

Preflight check and setup for the tool-comparison benchmark. Idempotent — safe to re-run.

## What this command does

1. Verifies jcodemunch MCP is connected and the repo is indexed
2. Verifies graphify-out/graph.json exists and is current
3. Checks semble availability and installs if missing
4. Reports a readiness table — any ✗ item must be resolved before running `/benchmark-council`

---

## Step 1 — jcodemunch MCP

Check whether jcodemunch is connected in this session:

```bash
claude mcp list 2>/dev/null | grep jcodemunch || echo "jcodemunch: NOT FOUND in mcp list"
```

If not found:
```bash
claude mcp add --scope user jcodemunch uvx jcodemunch-mcp
# Then restart Claude Code and re-run /benchmark-setup
```

If found but disconnected, the MCP server failed to start. Re-add:
```bash
claude mcp remove jcodemunch --scope user
claude mcp add --scope user jcodemunch uvx jcodemunch-mcp
```

### Index the repo

Call `index_folder` on the repo root to ensure the AST index is fresh. Resolve the repo
root dynamically:

```bash
git rev-parse --show-toplevel
```

Then call: `index_folder { "path": "<output from above>", "incremental": true, "use_ai_summaries": false }`

Verify with `get_session_stats {}` — symbol_count should be > 1,000 for this repo.

**Staleness note:** the index is a point-in-time snapshot. Re-run `index_folder` with
`incremental: true` after any large commit batch. For the benchmark, always re-index
immediately before a v4 run.

---

## Step 2 — graphify graph.json

```bash
ls graphify-out/graph.json 2>/dev/null && echo "✓ graph.json present" || echo "✗ graph.json missing — run: graphify index ."
```

If missing:
```bash
# Rebuild the graph (requires graphify installed via uvx graphify-py or ~/.local/bin/graphify)
graphify index . 2>/dev/null || uvx graphify-py index .
```

Check the node count:
```bash
node -e "const g=JSON.parse(require('fs').readFileSync('graphify-out/graph.json','utf8')); console.log('nodes:', g.nodes.length, 'links:', g.links.length);"
```

Expected: ~213 nodes, ~267 links for this repo. Significantly fewer → index is stale.

---

## Step 3 — semble (C8 config)

Semble is a sentence-transformer embedding library for local semantic code search.
Used as the C8 config in v4 benchmarks.

```bash
python3 -c "import semble" 2>/dev/null && echo "✓ semble installed" || echo "✗ semble missing"
```

If missing (use `uv` — never `pip`):
```bash
uv tool install semble 2>/dev/null || uv pip install --system semble
```

Build a semble index for this repo:
```bash
python3 -c "
import semble, os, json, pathlib

repo_root = '.'
index_path = pathlib.Path('graphify-out/semble-index.pkl')

# Collect all TypeScript/JavaScript files (skip node_modules, dist, .next)
files = []
for root, dirs, fnames in os.walk(repo_root):
    dirs[:] = [d for d in dirs if d not in ('node_modules', 'dist', '.next', '.turbo', 'coverage')]
    for f in fnames:
        if f.endswith(('.ts', '.tsx', '.js', '.jsx')):
            files.append(os.path.join(root, f))

print(f'Indexing {len(files)} files...')
idx = semble.Index()
for fp in files:
    try:
        idx.add_file(fp)
    except Exception as e:
        print(f'  skip {fp}: {e}')

idx.save(str(index_path))
print(f'Index saved to {index_path} ({index_path.stat().st_size // 1024}KB)')
"
```

If semble API differs from above, adjust — check `python3 -c "help(semble)"` for the
actual API. Semble is new; its interface may vary from the above template.

---

## Step 4 — Readiness report

Print a readiness table:

```bash
echo ""
echo "=== Benchmark readiness ==="
echo ""

# jcodemunch (check index file exists as proxy)
JC_INDEX=$(ls ~/.code-index/*.db 2>/dev/null | head -1)
[ -n "$JC_INDEX" ] && echo "✓ jcodemunch  index: $JC_INDEX" || echo "✗ jcodemunch  index: not found — run Step 1"

# graphify
[ -f graphify-out/graph.json ] && echo "✓ graphify    graph.json present" || echo "✗ graphify    graph.json missing — run Step 2"

# semble
python3 -c "import semble" 2>/dev/null && echo "✓ semble      installed" || echo "✗ semble      not installed — run Step 3"
[ -f graphify-out/semble-index.pkl ] && echo "✓ semble      index built" || echo "✗ semble      index missing — run Step 3"

echo ""
echo "If all ✓: run /benchmark-council (or reference the v4 plan at"
echo ".claude/reports/benchmark-v4/PLAN.md for the extended test suite)"
echo ""
```

---

## After setup: updating docs and cc-audit

Once all tools are green, run:

1. `/anatomy refresh` — refreshes wiki pages that may reference old navigation guidance
2. `/cc-audit` — the audit now checks for jcodemunch MCP presence in settings

If cc-audit reports jcodemunch missing from MCP config, register it:
```bash
claude mcp add --scope project jcodemunch uvx jcodemunch-mcp
```

Project-scope (`--scope project`) is preferred over user-scope (`--scope user`) for
team repos — it scopes the MCP to this repo only and documents it in `.claude/settings.json`.
