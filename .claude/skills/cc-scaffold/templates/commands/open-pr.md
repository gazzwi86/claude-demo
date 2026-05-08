---
name: open-pr
description: Clean up, advisory code review, blocking security review, anatomy freshness check, push, and open a PR.
---

# /open-pr

Orchestrates the full pre-PR cleanup and review workflow. Run this when
you have committed (or staged) changes ready to ship.

## Steps

1. **Confirm branch state.** Run `git status` and
   `git log --oneline @{u}..HEAD 2>/dev/null || git log --oneline main..HEAD`
   to show the pending changes. If the branch is `main`, stop and tell
   the user to switch to a feature branch.

2. **Clean up: `/simplify`.** Invoke the `/simplify` skill on the
   changed files. Only keep changes that preserve behaviour. Commit the
   cleanup as a separate commit named `cleanup: /simplify pass` if
   anything changed.

3. **Advisory code review: `/review`.** Run `/review` on the diff of
   the pending commits. Output the findings. Advisory — do not block,
   but surface them so the author can decide whether to address them
   before pushing.

4. **Blocking security review: `/security-review`.** Invoke
   `/security-review` on pending changes. If it reports any
   high-severity finding (credentials, eval, injection), STOP and tell
   the user to fix the issues before merging — do not push.

5. **Anatomy freshness check** (if `/anatomy` is set up). Run:

   ```
   python3 .claude/scripts/hooks.py check-anatomy-fresh
   ```

   If it exits non-zero (stale wiki entries detected), STOP. Run
   `/anatomy <stale-files>` on the listed files, then re-run the
   check. Do not push until the wiki is fresh.

6. **Push the branch.** `git push -u origin HEAD`. If pre-push hooks
   fail, report and stop.

7. **Open the PR via the platform CLI.** Run `gh pr create` (or
   equivalent for the host) with:

   - Title: a concise summary of the change (under 70 chars).
   - Body: a `## Summary` section (1–3 bullets) and a `## Test plan` checklist.
   - The `attribution.pr` suffix from settings.json is appended automatically by Claude Code.

8. **Report.** Surface:

   - PR URL
   - `/simplify` outcome (no-op or commit ref)
   - `/review` top findings (advisory)
   - `/security-review` summary
   - anatomy check outcome

## Constraints

- Never bypass git hooks (`--no-verify`) without explicit user approval.
- Never force-push to a shared branch.
- If any step fails, stop and report — do not proceed past failures.
- Run `gh pr create` only after a successful push.
