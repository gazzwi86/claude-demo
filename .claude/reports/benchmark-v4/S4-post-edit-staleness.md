---METRICS---
scenario: S4
scenario_name: post_edit_staleness
config_under_test: c3 (jcodemunch)

procedure: |
  1. Apply T3 edit (add `tags: z.array(z.string()).max(10).optional()` to CreateLoopSchema in
     packages/shared/src/schemas.ts).
  2. WITHOUT calling index_folder, immediately call:
     get_symbol_source { symbol_id: "packages/shared/src/schemas.ts::CreateLoopSchema#constant", verify: true }
  3. Compare returned source vs live file.
  4. Inspect _freshness flag.

result: |
  jcodemunch returned the PRE-EDIT source (7 fields, no `tags`).
  content_hash: 3788cc3a... (PRE-EDIT hash; matches the indexed snapshot)
  content_verified: true   <-- THE BUG: hash matches indexed content, not live file
  _freshness: "stale_index"  <-- correct staleness flag

key_finding: |
  jcodemunch's `content_verified: true` is computed against the indexed snapshot's hash,
  NOT the live file. A consumer that trusts `content_verified: true` will silently use
  stale code. The `_freshness: "stale_index"` field is the ONLY honest signal that the
  index hasn't been refreshed since the file was last edited.

  Implication: the agent must check `_freshness` (or compare content_hash to a fresh
  hash of the live file) before trusting any get_symbol_source response after an edit.

implications:
  - "Quality risk: an LLM-driven refactor that depends on a stale schema body could miss new fields, generate wrong types, or break runtime validation. Real bug class."
  - "Re-index SLA: trigger index_folder { incremental: true } after every Edit/Write to a tracked source file. PreToolUse hook on Edit|Write that records the path; PostToolUse re-indexes asynchronously."
  - "MCP tool wrapper: add a thin wrapper that calls index_folder before any get_symbol_source if the file's mtime > index timestamp."
  - "PLAN.md S4 stopping condition: re-index SLA established. Recommended SLA: re-index on every commit + on every Edit to apps/**, packages/**, infra/**."

re_index_sla_proposal: |
  Trigger    | Action
  ---------- | ------
  Edit/Write | PostToolUse hook records path; debounced re-index after 5s idle
  Commit     | pre-commit hook calls index_folder { incremental: true }
  Cold start | SessionStart hook checks last_index_at; if > 1h old, re-index in bg
  CI         | post-merge job re-indexes shared artifact (or skip if per-user)

charge_to_v4_results: |
  This finding upgrades F1 (RESULTS.md "_freshness is a free signal") from
  "useful flag" to "load-bearing safety check". A C3-using agent that ignores
  _freshness will produce technically-pass-typecheck-but-semantically-wrong code
  on any post-edit query. The benchmark's quality_verdict columns all passed
  because the implementation phase always re-fetched after revert; production
  agents working incrementally have no such reset.

---END METRICS---
