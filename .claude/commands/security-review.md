---
allowed-tools: Read, Bash, Glob, Grep, Write, Edit
description: Perform a security review of this repository, or remediate specific findings.
---

Invoke the security-reviewer agent for a full OWASP confidence-scored security review,
or pass VULN-IDs to invoke the security-remediate skill for targeted fixes.

## Usage

- `/security-review` — full scan; produces SECURITY_REPORT.md
- `/security-review VULN-001 VULN-003` — remediate specific findings from an existing SECURITY_REPORT.md

## What happens

**Full scan:** The security-reviewer agent maps the repository, greps for high-risk
patterns, performs deep file review against the OWASP Top 10, and writes
SECURITY_REPORT.md with confidence-scored findings. Only HIGH and MEDIUM findings
with confidence ≥ 0.8 are reported.

**Remediate:** The security-remediate skill reads SECURITY_REPORT.md for the listed
VULN-IDs, implements minimal targeted fixes, adds regression tests, and strikes through
fixed findings in the report (audit trail preserved).

See the source patterns at:
- [ai-dev-sec-ops security-review command](https://github.com/gazzwi86/ai-dev-sec-ops/blob/7a83c7f/.claude/commands/security-review.md)
- [HITL PR patterns research](https://github.com/gazzwi86/ai-dev-sec-ops/blob/7a83c7f/.research/hitl-pr-patterns.md)

$ARGUMENTS
