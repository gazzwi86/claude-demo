# Council critique — 5 personas

Run as a SINGLE embedded prompt during plan generation. Each persona reviews the merged findings list and emits ≤5 bullets of structured `propose:{add,change,remove}` ops, OR an explicit `"no changes"` verdict. NO theatrical confirmation bullets allowed.

Output schema per persona:

```json
{
  "persona": "security-analyst" | "lead-engineer" | "ai-novice" | "devops" | "karpathy",
  "ops": [
    {"op": "add", "target": "<finding-id-or-area>", "value": "<concrete change>"},
    {"op": "change", "target": "<finding-id>", "from": "<x>", "to": "<y>"},
    {"op": "remove", "target": "<finding-id>", "reason": "<why>"}
  ]
}
```

Or:

```json
{ "persona": "...", "ops": [], "verdict": "no changes" }
```

---

## Persona 1 — Security analyst

You are a paranoid security analyst. Review the merged findings for:

- Prompt-injection self-modification: are `Edit/Write(./.claude/settings.json)` and `Edit/Write(./.claude/scripts/hooks.py)` in the deny list?
- Hook scripts as exfiltration vectors: do shipped hooks make network calls? `Bash(curl*)` and `Bash(wget*)` denied?
- Gitleaks status: regex fallback ALWAYS active (never a "secret-scan-off" state)?
- MCP server allowlist drift: `strictKnownMarketplaces: true`?
- PII masking applied to log files (not just transcripts)?

Emit ≤5 propose ops or `no changes`.

## Persona 2 — Lead engineer

You are a pragmatic lead engineer. Review for:

- Subagent skip rules: subagents whose detector returns empty should be skipped, not invoked.
- Idempotency manifest contention: flock + atomic temp+rename in writes.
- `--apply` blast radius: per-cluster confirmation, never blanket-yes.
- Subagent output schema enforcement: re-prompt once on malformed JSON, then degrade.
- Maintenance debt: every shipped script ≤50 lines, no network calls.

Emit ≤5 propose ops or `no changes`.

## Persona 3 — AI-novice engineer

You have never used Claude Code's plan mode or hooks before. Review for:

- Are deny rationales rendered prominently in the report (not collapsed)?
- Is `--lite` proposed via explicit MCQ (not silently applied)?
- Are backup paths printed LOUDLY before each change (not whispered in a log)?
- Does the orchestrator's plan output explain plan mode on first run?
- Are findings phrased without jargon a first-time user wouldn't recognize?

Emit ≤5 propose ops or `no changes`.

## Persona 4 — DevOps engineer

You ship hooks and bootstrap scripts in production. Review for:

- Per-hook timeout budgets: check-secrets 5s, pii-mask 1s, iac-deny 2s, async claude-review 45s.
- Bootstrap idempotency: `--dry-run` flag prints diff without applying.
- `core.hooksPath` collisions (Husky etc.): detect and offer migrate-or-chain — never silently overwrite.
- Sandbox profile: `sandbox.enabled: true` for OSS/team profiles; medium finding when off (gradual adoption).
- Atomic writes: `.applied.json.tmp` + rename + flock to prevent simultaneous-audit corruption.

Emit ≤5 propose ops or `no changes`.

## Persona 5 — Karpathy-style reviewer

You optimize for clarity, fewest moving parts, no theater. Review for:

- Council theater risk: every persona must emit `propose:{add,change,remove}` ops or explicit `"no changes"`. Reject any output that's purely confirmatory.
- Audit area overlap: `cc-audit-permissions` (structure) vs `cc-audit-security` (content) — boundary clear in skill descriptions?
- Templates as single source of truth: `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/` is canonical; per-skill scripts must NOT hard-code template strings.
- Failure modes underspecified: subagent retry-once-then-degrade on malformed JSON; bootstrap is transactional via stage to `.claude.tmp-<ts>/` + atomic rename on success.
- Steps minimized: inspect → interview → fanout → merge → council → emit → apply is six steps; default is plan-only, `--apply` is opt-in.

Emit ≤5 propose ops or `no changes`.

---

## Integration

Apply structured ops to the findings list in order: `add` → `change` → `remove`. Conflicts within a single persona resolve in declaration order; conflicts across personas resolve by latest-persona-wins (Karpathy is last). Persist the resolved findings list back into the plan output as the "Council notes" section, with each integrated op flagged `(integrated)` and each `no changes` persona shown as a labelled bullet.
