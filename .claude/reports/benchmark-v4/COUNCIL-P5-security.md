# Council Review — P5 Security

Reviewer: P5 (Security Engineer)
Scope: v4 benchmark tool stack (jcodemunch MCP, graphify, semble)
Inputs: RESULTS.md, PLAN.md, .claude/commands/benchmark-setup.md

## Threat surface

### 1. jcodemunch — data egress during indexing

`uvx jcodemunch-mcp` runs as a local MCP subprocess. `index_folder` walks the repo and writes the AST index to `~/.code-index/*.db`. No evidence of network egress in the setup script (Step 1) or RESULTS.md telemetry — `_freshness` and `content_hash` (F1) are local fields. **Verdict: local-only assumed, but UNCONFIRMED.** Action: run `lsof -p <jcodemunch-mcp pid>` during `index_folder` and add a finding in cc-audit-tools to assert no outbound sockets.

### 2. Content hashing (F1)

F1 confirms responses include `content_hash` per symbol — good for tamper detection of the on-disk index, but the hash is per-symbol-body, not per-file. A modified comment block in the same file may not bump the hash. Cannot rely on it as an integrity oracle for license/secret scanning.

### 3. Supply-chain — `uvx jcodemunch-mcp` (no version pin)

benchmark-setup.md Step 1 invokes `uvx jcodemunch-mcp` with no `==<version>`. `uvx` resolves to the latest PyPI release each cold start — a compromised release executes immediately as MCP. **Severity: high.** Fix: pin to a known-good version (`uvx jcodemunch-mcp==X.Y.Z`) and document the SHA in `.claude/settings.json` mcp registration. Same applies to `uvx graphify-py` (Step 2) and `uv tool install semble` (Step 3).

### 4. graphify-out/graph.json leak

Confirmed gitignored (RESULTS.md "Tier 1 changes implemented", PLAN.md ctx). Symbol names, file paths, and link topology are private design info; if a contributor commits it manually, secrets in symbol names (rare but possible) leak. Add a pre-commit hook gate: deny `graphify-out/**` in `git add`.

### 5. semble-index.pkl — pickle deserialisation RCE

**Severity: critical.** PLAN.md §Docs item 4 only proposes gitignoring the pkl, not warning about it. RESULTS.md notes "pickle-based persistence" approvingly. Python `pickle.load` executes arbitrary code embedded in the stream — any contributor who downloads a teammate's pkl, or any CI step that restores a cached index from an untrusted artifact store, runs attacker code. Mitigations:

- Never share `semble-index.pkl` across machines/users
- Rebuild locally from source (`/benchmark-setup` already does this)
- Add a cc-audit-tools finding: deny pkl in commits and CI cache restores
- Long-term: switch semble persistence to a safe format (npz, parquet, sqlite) or upstream a request

### 6. Minimum-privilege MCP scope

Current guidance (PLAN.md §cc-audit integration): `--scope project`. Correct — narrower than `--scope user`. Additional hardening:

- Set `trusted_folders` on jcodemunch to the repo root only — prevents an off-repo `index_folder` call from harvesting `~/.ssh` or `~/.aws`
- MCP allowlist (cc-audit-enterprise): restrict to `mcp__jcodemunch__*` and decline the embedding/AI-summary tools (`use_ai_summaries: false` already set in Step 1 — keep it)
- Deny `mcp__jcodemunch__embed_repo` and `mcp__jcodemunch__check_embedding_drift` unless an explicit C8-replacement task needs them (these may make outbound model calls)

## Findings

| ID | Severity | Item |
|----|----------|------|
| S-1 | high | `uvx` invocations unpinned (jcodemunch, graphify, semble) |
| S-2 | critical | `semble-index.pkl` is unsafe to load from untrusted source |
| S-3 | medium | jcodemunch network egress unverified |
| S-4 | low | `graphify-out/` not enforced by hook, only by .gitignore |
| S-5 | medium | MCP tool allowlist not narrowed; embed/AI tools enabled by default |

## Recommendations (ordered)

1. Pin all `uvx` invocations in benchmark-setup.md and `.claude/settings.json`.
2. Add cc-audit-tools rule: deny `**/*.pkl` and `graphify-out/**` in commits; warn on CI cache restore of either.
3. Document semble-index.pkl threat model in PLAN.md §Docs item 4 — gitignore is necessary but not sufficient.
4. Verify jcodemunch-mcp egress with `lsof`/`pktap` once; record in COUNCIL-COSTS.md or a security note.
5. Set `trusted_folders` and a narrowed MCP tool allowlist for jcodemunch.
