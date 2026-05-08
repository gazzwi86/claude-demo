---
name: cc-audit
description: Audits and scaffolds Claude Code configuration in a target repository against strict-by-default best practices. Use when the user invokes /cc-audit, asks to "review .claude/", "scaffold strict-by-default Claude Code setup", "remediate Claude Code drift", or "audit Claude Code config". Inspects deterministically, interviews via MCQ, fans out 9 per-area subagents in parallel, runs a 5-persona council critique, emits a plan-mode diff bundle, and (with --apply) invokes bootstrap.sh to scaffold safely with backups and per-cluster confirmation.
when_to_use: User runs /cc-audit, asks to audit, scaffold, or harden Claude Code configuration in a repo, or wants a strict-by-default .claude/ baseline.
argument-hint: "[--apply] [--lite] [--force] [--dry-run] [--metrics]"
allowed-tools: ["Read", "Glob", "Grep", "Bash", "Write", "Edit", "AskUserQuestion", "Agent"]
---

# cc-audit — orchestrator

Strict-by-default audit and scaffolder for any repo's `.claude/` configuration.
Source plan: `/Users/gareth/Sites/claude-demo/.claude/plans/proud-whistling-rose.md`.

## Distribution

- **Project-local (this repo, the demo source of truth)**: this skill plus nine `cc-audit-<area>` audit skills under `${CLAUDE_PROJECT_DIR}/.claude/skills/`, each with their own `inspect.py` and `best-practises.md`. Demonstrates the patterns this skill scaffolds elsewhere.
- **Scaffolded by bootstrap.sh into a target repo**: `.claude/{settings.json,scripts/,rules/,plans/,reports/,best-practises/,logs/}` + a top-level `CLAUDE.md` skeleton.

The orchestrator NEVER edits the target repo's `.claude/settings.json` directly in-session — it generates a diff bundle and either emits as plan-mode output (default) or invokes `bootstrap.sh --apply`. This is the **self-modification guard**: even under prompt injection the agent cannot rewrite the permissions that constrain it, because the deny list includes `Edit/Write(./.claude/settings.json)` and `Edit/Write(./.claude/scripts/hooks.py)`.

## Flags

`/cc-audit` accepts: `--apply`, `--lite`, `--force`, `--dry-run`, `--metrics`. See the slash-command alias for definitions.

## 7-step orchestration flow

### 1. Inspect (deterministic; no LLM)

Run `python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/inspect_repo.py <repo-root>` if present, otherwise enumerate by hand using Read/Glob:

- Languages and frameworks (presence of `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `dbt_project.yml`).
- Git state (`.git/` exists, `core.hooksPath`, remote, single-committer heuristic, CI presence via `.github/workflows/`).
- Monorepo signals (`pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `apps/`, `packages/`, `services/`, multiple language manifests at depth ≥1).
- OSS heuristics (`LICENSE` + remote URL matches public hosts).
- Managed-settings presence (macOS `/Library/Application Support/ClaudeCode/`, Linux `/etc/claude-code/`, Windows `C:\Program Files\ClaudeCode\`).
- Lite-profile heuristics (no remote / single committer / no CI / no LICENSE).
- Existing `.claude/` contents and `.claude/best-practises/.applied.json` manifest if present.

Cache as `inspect-result.json`; pass to every subagent so they don't re-detect.

### 2. Interview (≤8 MCQs via AskUserQuestion)

Conditional on inspect findings. Examples:
- "Looks like a solo / throwaway repo. Use the `--lite` profile?" (only if heuristics match).
- "Detected `core.hooksPath = .husky`. Migrate or chain?"
- "Public-OSS repo detected. Strip `companyAnnouncements` and gitignore `settings.local.json`?"
- "No gitleaks binary. Recommend install or ship the regex fallback only?"

Skip questions whose answer is unambiguous from the inspect result.

### 3. Fan out per-area subagents IN PARALLEL

Spawn ONE Agent (subagent_type=general-purpose) per audit skill, in a single batched message. Pass the inspect result and the target repo path. Each subagent calls its `cc-audit-<area>` skill, which runs that area's `inspect.py` and returns a Finding[] JSON document.

The nine areas: `cc-audit-settings`, `cc-audit-claude-md`, `cc-audit-skills`, `cc-audit-hooks`, `cc-audit-permissions`, `cc-audit-security`, `cc-audit-git-hooks`, `cc-audit-enterprise`, `cc-audit-monorepo`.

**Skip rules** (lead-engineer council fix): if the inspect result shows the area is empty or N/A — single-package repo for monorepo, no `.git/` for git-hooks, lite profile for enterprise — record `{"area": "...", "skipped": true, "reason": "..."}` and don't spawn the subagent.

**Schema enforcement** (lead-engineer council fix): if a subagent returns malformed Finding JSON, re-prompt once; on second failure, log and degrade.

### 4. Merge findings; dedupe cross-area concerns

Concatenate all Finding[] arrays into a single list. Apply ownership boundary: `cc-audit-permissions` owns deny/allow *structure*, `cc-audit-security` owns *content* of denies relating to filesystem/secret reads. Drop duplicates.

### 5. Council pass — 5 personas in sequence (single embedded round-trip)

Read `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/council.md`. Run the prompt with the merged findings as input. Each persona must emit `propose:{add,change,remove}` ops or `"no changes"`. Apply structured ops to the findings list before emitting the plan.

### 6. Emit plan

Write `<repo>/.claude/reports/CLAUDE-CONFIGURATION-AUDIT.md` containing:
- Required Reading Digest (excerpt from the plan above; cite Anthropic + community sources).
- Inspect summary.
- Findings grouped by area, severity-ordered (high → medium → low), with rationale rendered prominently (AI-novice persona fix).
- Council notes as a labelled section.
- Per-cluster diff bundles (one for each remediation cluster — the user approves clusters individually).

Emit to plan mode for user review. **Explain plan mode on first run** (AI-novice fix: "Plan mode lets you review changes before they hit disk; type `Approve` per cluster or `Reject`").

### 7. Apply (only when --apply, after per-cluster confirmation)

For each approved cluster, invoke:

```
bash ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/bootstrap.sh --apply --cluster=<id>
```

`bootstrap.sh` (not Claude in-session) writes the changes. Per-cluster confirmation is enforced inside the script — never blanket-yes.

After apply: update `<repo>/.claude/best-practises/.applied.json` (atomic temp+rename + flock).

## Required Reading Digest

Cite in the emitted report:

- **Anthropic primary**: best-practices guide (Explore→Plan→Implement→Commit; bloated CLAUDE.md gets ignored; second correction = `/clear` not third fix; hooks are for things that "must happen every time"); settings docs (precedence Managed > CLI > local > project > user; arrays concat+dedupe, objects deep-merge, scalars override); hooks docs (~25 events, exit `0`/`2`, exit 1 does NOT block — Unix convention flipped); skills best-practices (frontmatter required, ≤500-line bodies, third-person descriptions).
- **Community gotchas**: deny-rule enforcement gaps in some clients (back deny rules with PreToolUse hooks), settings precedence confusion, hook stdin contention (central dispatcher fixes), prompt injection via tool output, worktree disk explosion in monorepos.
- **Security**: gitleaks v13+ (174 default rules) preferred; eight-pattern regex fallback ALWAYS active.

## Conventions mirrored

The local repo at `/Users/gareth/Sites/claude-demo/.claude/scripts/hooks.py` is the canonical central dispatcher pattern. All shipped templates mirror it: `python3 ${CLAUDE_PROJECT_DIR}/.claude/scripts/hooks.py <event> [check]`, dispatch tables, `read_payload()` for stdin JSON, `rel_from_root()` helper, exit 0/2/64.

## Idempotency manifest

`.claude/best-practises/.applied.json` records template versions and SHA-256 hashes per file. Re-runs show drift. `--force` ignores the manifest. User-edited divergence is preserved unless `--force`. Writes are atomic via `.applied.json.tmp` + rename, with flock.

## Edge cases (see plan §"Edge-case matrix")

Non-git, managed policy locks, solo/throwaway, polyglot monorepo, OSS/public, existing config differs, re-run on already-applied repo, custom hooks, `core.hooksPath` collision (Husky), native skills available, anatomy present, experimental "permissive" repo (`.claude/.profile=permissive`).

## Council critique

`${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/council.md` defines five personas. Each emits ≤5 bullets of structured `propose:{add,change,remove}` ops or `"no changes"`. NO theatrical confirmation bullets.
