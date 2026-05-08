# jCodeMunch-MCP Assessment

_Generated 2026-05-08. Assessed against claude-demo monorepo at main._

---

## TL;DR

**Verdict: Net-positive. Added to global user config.**

jcodemunch-mcp (v1.81.3, installed via `uv tool`) fills a gap that graphify and ANATOMY/wiki don't cover: symbol-level retrieval (`get_symbol_source`) and identifier-level reference graphs (`find_references`). It's been added to `~/.claude.json` (global user scope) and verified connected. The recommended "never use Read/Grep/Glob" CLAUDE.md policy was NOT added — it would break graphify hooks and existing skills.

---

## 1. Existing capability landscape

| Tool | What it does | Status |
|---|---|---|
| **graphify** | Knowledge graph (JSON) of cross-file dependencies; queried instead of grepping | Wired in hooks (graphify-hint on Glob/Grep); **not indexed** on this machine — `graphify-out/` absent |
| **ANATOMY.md + docs/wiki/** | LLM-maintained per-area structural docs; 11 wiki pages, 7,295 chars total | Wiki pages exist; ANATOMY.md is a stub |
| **context7 MCP** | Fetches external library docs (React, Next.js, Fastify, etc.) | Wired in project `settings.json`; unrelated to codebase exploration |
| **grep / Read / Glob** | Native Claude Code file tools | Always available; hooks emit a graphify-hint nudge when used |

### What was missing

- **Symbol-level retrieval without whole-file reads.** Graphify tracks file-level imports, not symbol bodies. ANATOMY/wiki describes files structurally. Neither returns "just the PadNode class body" without reading the full file.
- **Identifier-level reference tracking.** Graphify can trace which files import a module; it cannot answer "every call site of a specific function" without text search.

---

## 2. What jcodemunch-mcp provides

Source: [QUICKSTART.md](https://github.com/jgravelle/jcodemunch-mcp/blob/main/QUICKSTART.md)

jcodemunch indexes once via tree-sitter AST parsing and exposes MCP tools:

| Tool | Purpose |
|---|---|
| `index_folder` / `index_file` | Build / update the index |
| `search_symbols` | Find functions, classes, methods by name |
| `get_symbol_source` | Return only a specific symbol's source (not the whole file) |
| `get_file_outline` | List all symbols in a file |
| `find_importers` | Which files import a given file |
| `find_references` | All references to an identifier across the repo |
| `search_text` | Full-text search |
| `get_session_stats` | Token savings accounting per session |

---

## 3. Overlap analysis

| Capability | graphify | ANATOMY/wiki | grep+Read | jcodemunch |
|---|---|---|---|---|
| Cross-file import graph | ✓ (file-level) | ✗ | ✗ | ✓ (file + symbol) |
| "Find callers of X" | Partial (file deps) | ✗ | ✓ (text match) | ✓ (AST-accurate) |
| Read only a symbol, not the whole file | ✗ | ✗ | ✗ | ✓ |
| Per-area structural docs | ✗ | ✓ | ✗ | ✗ |
| External library docs | ✗ | ✗ | ✗ | ✗ |
| Requires prior indexing | ✓ | ✓ (via /anatomy) | ✗ | ✓ |
| Free / open use | ✓ | ✓ | ✓ | Non-commercial only |

**Unique to jcodemunch**: `get_symbol_source` (sub-file precision), `find_references` (identifier-level), `get_session_stats` (token accounting), AST accuracy over text-match.

**Genuine overlap**: cross-file dependency queries (both graphify and jcodemunch do this, differently). The CLAUDE.md policy jcodemunch recommends also collides directly with graphify's hook-nudge mechanism — which is why it wasn't applied.

---

## 4. Token comparison — concrete scenario

**Task: "Understand PadNode and find all its callers"**

This is the canonical graphify demo scenario (DEMO_GUIDE §13).

Measured on this machine: `padNode.ts` (3,086 chars), `engine.ts` (5,634 chars), `usePad.ts` (2,213 chars). Grep output for PadNode references: 556 chars.

### Approach A — Brute read (no tools)

Read all three relevant files in full:

| File | Chars | Tokens (~÷4) |
|---|---|---|
| `apps/web/lib/audio/padNode.ts` | 3,086 | 772 |
| `apps/web/lib/audio/engine.ts` | 5,634 | 1,409 |
| `apps/web/hooks/usePad.ts` | 2,213 | 553 |
| **Total** | **10,933** | **~2,733** |

### Approach B — Grep + targeted read (measured)

Grep for `PadNode` references (556 chars, ~139 tokens), then read only `padNode.ts` for the implementation (3,086 chars, ~772 tokens):

**Total: ~911 tokens.** 67% reduction vs brute read — but you get the whole file, not just the class body.

### Approach C — ANATOMY.md / docs/wiki

Read `docs/wiki/web-audio.md` for orientation (~650 chars estimated, ~163 tokens), confirm which files matter, then grep + read. Wiki gives you "where is X" orientation but does not identify callers or return symbol source.

**Total: ~1,074 tokens.** No improvement over B for this task; wiki is complementary, not a replacement.

### Approach D — graphify (estimated, if indexed)

Query `graphify-out/graph.json` for the PadNode node and incoming edges. Returns focused JSON — estimated ~700 chars (~175 tokens). No full-file reads needed for the caller list.

**Total: ~175 tokens.** ~94% reduction vs brute read. _(Cannot measure: index absent on this machine — run `/setup graphify` to create it.)_

### Approach E — jcodemunch (estimated, if indexed)

| Call | Estimated output chars | Tokens |
|---|---|---|
| `resolve_repo` | 100 | 25 |
| `search_symbols("PadNode")` | 300 | 75 |
| `get_symbol_source(PadNode class)` | 500 | 125 |
| `find_references("PadNode")` | 350 | 88 |
| **Total** | **~1,250** | **~313** |

**~313 tokens.** ~89% reduction vs brute read. Advantage over graphify: returns the actual symbol body (not just caller locations), and `find_references` is identifier-level not file-level.

_(Estimates — the MCP server is connected but actual comparison requires a live Claude session with the project indexed via `index_folder`.)_

### Summary

| Approach | ~Tokens | Reduction vs brute |
|---|---|---|
| Brute read | 2,733 | — |
| Grep + targeted read | 911 | 67% |
| ANATOMY/wiki + grep | 1,074 | 61% |
| graphify (if indexed) | ~175 | ~94% |
| jcodemunch (if indexed) | ~313 | ~89% |

graphify wins on raw token count for simple "who imports X" queries. jcodemunch wins where you also need the symbol body without reading the whole file. Both win decisively over grep + brute read.

---

## 5. Risks and mitigations applied

**The CLAUDE.md enforcement policy was not added.** The QUICKSTART recommends "never fall back to Read/Grep/Glob" in `~/.claude/CLAUDE.md`. This was explicitly excluded because: it conflicts with graphify's PreToolUse hook-nudge on `Glob|Grep`; it breaks the anatomy, graphify, and other skills that legitimately use Read/Grep/Glob; and it creates a blanket prohibition that makes Claude worse at everything else. jcodemunch tools will be called when explicitly prompted or when Claude judges them the right tool — not by a blanket ban.

**Commercial license.** jcodemunch requires a paid license for commercial use. Verify before using in production team workflows beyond personal evaluation.

**Both graphify and jcodemunch need to be indexed.** Neither works until you run `index_folder` (jcodemunch) or `/setup graphify` + `graphify index .` (graphify). They are not interchangeable indexes — run both if you want both capabilities.

---

## 6. Verdict

**Net-positive. Added to global config.**

Reasoning:
- Fills a genuine gap (symbol-level retrieval, identifier-level references) that graphify and ANATOMY/wiki don't cover.
- Coexists cleanly with the existing stack when the CLAUDE.md blanket policy is excluded.
- v1.81.3 already installed via `uv tool`; zero additional install cost.
- `uvx jcodemunch-mcp` avoids PATH issues — the right form for MCP config.
- For this small demo repo the token savings are modest; on real codebases (>20k lines) the savings become compelling.

---

## 7. Config applied + new-machine instructions

### What was applied (this machine)

```bash
claude mcp add --scope user jcodemunch uvx jcodemunch-mcp
# Stored in: ~/.claude.json (NOT ~/.claude/settings.json)
# Verified: claude mcp list → jcodemunch: uvx jcodemunch-mcp - ✓ Connected
```

**Key finding: `mcpServers` is NOT a valid key in `~/.claude/settings.json`.** The user-level settings.json schema rejects it. Global MCP servers are stored in `~/.claude.json` via `claude mcp add --scope user`. Project-level MCP servers (like context7) go in `.claude/settings.json` under `mcpServers` — that is project-scoped and valid there.

### Setting up jcodemunch on a new machine

**Prerequisites**: `uv` must be in PATH. That's the only dependency — `uvx` fetches jcodemunch-mcp on demand.

```bash
# Step 1: Install uv (if not present)
curl -LsSf https://astral.sh/uv/install.sh | sh   # or: brew install uv

# Step 2: Verify uvx resolves the package
uvx jcodemunch-mcp --version   # should print version without error

# Step 3: Register as global MCP server
claude mcp add --scope user jcodemunch uvx jcodemunch-mcp
# Writes to ~/.claude.json. Do NOT add to settings.json — schema rejects it.

# Step 4: Restart Claude Code, then verify
claude mcp list   # jcodemunch should show ✓ Connected

# Step 5: Index your project (inside a Claude Code session)
# Prompt: "Index this project"
# Agent calls: index_folder { "path": "<cwd>" }

# Step 6: Confirm stats tracking
ls ~/.code-index/session_stats.json   # appears after first use
```

**Is `settings.json` enough?** No — for global (user-scoped) MCP servers it is the wrong file. The correct store is `~/.claude.json`, written by `claude mcp add --scope user`. For project-scoped servers (like context7), `.claude/settings.json` is correct.

**Do NOT add** the "never use Read/Grep/Glob" policy to `~/.claude/CLAUDE.md`. It breaks graphify hooks, anatomy skills, and legitimate file operations.

### Setting up context7 on a new machine (for comparison)

context7 is project-scoped, wired in `.claude/settings.json` — it comes with the repo when you clone it. The only prerequisite is Node.js/npx (for `npx -y @anthropic-ai/context7-mcp@latest`). No global install step needed.

```bash
# context7 is already in .claude/settings.json — just need npx available
node --version   # confirms Node is present
# Then open Claude Code in the repo — context7 connects automatically
```

### Summary: tool + scope matrix

| Tool | Config location | Scope | Install dependency |
|---|---|---|---|
| jcodemunch | `~/.claude.json` (via `claude mcp add --scope user`) | Global (all projects) | `uv` in PATH |
| context7 | `.claude/settings.json` (project `mcpServers`) | Project only | `node`/`npx` in PATH |
| graphify | `/setup graphify` in-REPL (indexes to `graphify-out/`) | Project only (per-repo index) | `uv` in PATH |
| ANATOMY/wiki | `git clone` + `/anatomy` command | Project only | None beyond repo |
