---
name: security-remediate
description: Generates targeted minimal fixes for specific vulnerabilities listed in SECURITY_REPORT.md. Invoked after human triage. Trigger: user comments "/remediate VULN-001 VULN-003" or asks to "fix the security findings" with specific IDs.
---

# Security Remediate

The security-remediate skill generates targeted, minimal code fixes for specific
vulnerability IDs from `SECURITY_REPORT.md`. It adds a regression test for each fix
and preserves the audit trail by striking through fixed findings rather than deleting them.

## Input

The skill accepts one or more VULN-IDs as arguments (e.g., `VULN-001 VULN-003`).
It reads `SECURITY_REPORT.md` to understand the full context of each listed finding.

## For each vulnerability

1. **Read the finding** — file path, line number, description, remediation guidance from the report.
2. **Read the affected file** — understand the surrounding code and existing patterns.
3. **Implement the minimal fix** — change only what is necessary to address the vulnerability; do not refactor, rename, or reorganise unrelated code.
4. **Add a regression test** — write a test that:
   - Fails without the fix (documents the attack vector)
   - Passes with the fix (confirms the mitigation)
   - Is placed alongside the existing test files or in a new `security/` test file.
5. **Run linter** — run the project's linter on modified files if one exists.
6. **Self-check** — re-read each modified file; verify the fix does not introduce new injection vectors, broken error handling, or unnecessary complexity.

## Update SECURITY_REPORT.md

For each successfully fixed vulnerability, update the heading:

```markdown
### ~~VULN-001: [Category]: `[file:line]`~~ [FIXED]
```

Update the Findings Summary table — add a `| Fixed | N |` row. Do NOT remove findings —
the strikethrough preserves the audit trail.

## Commit

Stage all modified files including SECURITY_REPORT.md. Commit with:

```
fix: remediate [VULN-IDs]
```

## Boundaries

- Fixes only the listed VULN-IDs — does not fix other issues discovered during review.
- Does not refactor code beyond what the vulnerability fix requires.
- Does not remove security findings from the report — strikes through only.
- If a fix cannot be applied with confidence, skips it and explains why in a comment.

## Evaluation criteria

- Each regression test must fail without the fix and pass with it.
- Fixed findings must be struck through in the report, not deleted.
- The commit message must list the VULN-IDs addressed.
- The skill must not modify files unrelated to the listed vulnerabilities.
- Modified files must pass the linter before the commit.
