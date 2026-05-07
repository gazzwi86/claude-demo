---
name: open-pr
description: Clean up, security-check, push, and open a PR with /review run on it.
---

# /open-pr

Orchestrates the full pre-PR cleanup and review workflow. Run this when you have committed (or staged) changes ready to ship.

## Steps

1. **Confirm branch state.** Run `git status` and `git log --oneline @{u}..HEAD 2>/dev/null || git log --oneline main..HEAD` to show the pending changes. If the branch is `main`, stop and tell the user to switch to a feature branch.

2. **Clean up: `/simplify`.** Invoke the `/simplify` skill on the changed files. Review its suggestions; only keep changes that preserve behaviour. Commit the cleanup as a separate commit named `cleanup: /simplify pass` if anything changed.

3. **Security pre-check: `/security-review`.** Invoke `/security-review` on pending changes. If it reports any high-severity finding (credentials, eval, injection), STOP and report findings to the user — do not push.

4. **Push the branch.** `git push -u origin HEAD`. If pre-push hooks fail, report and stop.

5. **Open the PR via `gh`.** Run `gh pr create` with:
   - Title: a concise summary of the change (under 70 chars).
   - Body: a `## Summary` section (1–3 bullets) and a `## Test plan` checklist.
   - The `attribution.pr` suffix from settings.json is appended automatically by Claude Code.

6. **Review the PR: `/review`.** After the PR is created, capture the PR number/URL and invoke `/review <PR_NUMBER>` to do a full review on the live PR.

7. **Report.** Surface to the user:
   - PR URL
   - `/simplify` outcome (no-op or commit ref)
   - `/security-review` summary
   - `/review` top findings

## Constraints

- Never bypass git hooks (`--no-verify`) without explicit user approval.
- Never force-push.
- If any step fails, stop and report — do not proceed past failures.
- Run `gh pr create` only after a successful push.
