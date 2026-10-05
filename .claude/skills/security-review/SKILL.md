---
name: security-review
description: Performs a confidence-scored security review of repository code against the OWASP Top 10. Trigger phrases: "review for security", "security audit", "check for vulnerabilities", "OWASP review", "find security issues". Called by security-reviewer agent or standalone.
---

# Security Review

The security-review skill performs a systematic code review against the OWASP Top 10,
reporting only HIGH and MEDIUM severity findings where exploitability confidence is ≥0.8.
It minimises false positives by applying documented false positive precedents before reporting.

## Phase 1 — Repo structure and signal detection

1. Use Glob to map the repository structure.
2. Grep for high-risk patterns:
   - Injection: `query`, `eval`, `exec`, `deserializ`, `innerHTML`, `dangerouslySetInnerHTML`
   - Auth: `X-Forwarded-For`, `isAdmin`, `role`, `permission`
   - Config: `cors`, `helmet`, `debug`, `DEFAULT_PASSWORD`
   - Secrets: `AKIA`, `ghp_`, `sk-`, `BEGIN PRIVATE KEY`
3. Read dependency manifests (`package.json`, `requirements.txt`, `go.mod`) for known-vulnerable packages.
4. If `*-audit-results.json` or `*wiz*.json` files exist, read them and cross-reference against findings.

## Phase 2 — Deep review of flagged files

For each file flagged in Phase 1:

- **Input validation** — SQL injection, command injection, XXE, NoSQL injection, path traversal, template injection
- **Auth and access control** — authentication bypass, IDOR, missing authorisation middleware, privilege escalation
- **Crypto** — hardcoded secrets, weak algorithms, certificate bypass
- **Data exposure** — sensitive data logging, API returning more data than needed, debug endpoints in production, verbose error handlers
- **Configuration** — overly permissive CORS/CSP, debug flags, default credentials, missing security headers

## Confidence scoring

Only report findings where confidence ≥ 0.8:

- 0.9–1.0: Certain exploit path identified
- 0.8–0.9: Clear vulnerability pattern with known exploitation method
- Below 0.8: Do not report

## False positive precedents

The skill does not report the following as vulnerabilities:

- React and Angular components — XSS-safe unless `dangerouslySetInnerHTML` / `bypassSecurityTrust*` / `v-html` are present
- Environment variables and CLI flags — treated as trusted values
- UUIDs — treated as unguessable
- Client-side JS auth checks — server-side auth is what matters
- Logging URLs — not a vulnerability; logging secrets or PII is
- Shell script patterns without a concrete untrusted-input path

## Output format

Write `SECURITY_REPORT.md` with:

```markdown
# Security Review Report

**Repository:** <name>
**Date:** <date>
**Tool Scope:** Semantic code review + dependency audit

## Findings Summary

| Severity | Count |
|----------|-------|
| High     | N     |
| Medium   | N     |

## Findings

### VULN-001: <Category>: `<file:line>`

- **Severity:** High | Medium
- **Confidence:** 0.X
- **OWASP Category:** A0N — <Name>
- **CWE:** CWE-NNN
- **Description:** <what the vulnerability is>
- **Exploit Scenario:** <how an attacker exploits this>
- **Remediation:** <specific fix with code example>
- **Estimated Effort:** Low | Medium | High
```

## Turn budget

The skill has a budget of 50 turns. If approaching turn 40 without a complete report,
write a partial report immediately — a partial report is better than no report.

## Evaluation criteria

- The skill reports only findings with confidence ≥ 0.8.
- Every finding includes a concrete exploit scenario (not a theoretical risk description).
- False positive precedents are applied before any finding is included.
- Each finding is numbered VULN-NNN sequentially.
- The skill writes SECURITY_REPORT.md to disk before the session ends.
- The skill does not report DoS vectors, rate-limiting issues, or style concerns.
