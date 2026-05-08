---
description: Testing rules. Path-globbed to test directories.
paths: ["**/test/**", "**/tests/**", "**/*.test.*", "**/*.spec.*"]
---

## Testing

- Every new behaviour ships with a test that would fail on the previous commit.
- Tests must be deterministic — no random data, no network, no real clocks. Mock or freeze.
- Assert specific values, not just truthiness.
- One assertion per behaviour; multiple assertions per test only if they describe one cohesive behaviour.
- Test names describe behaviour, not implementation: `it("returns 401 for unknown user")` not `it("calls authMiddleware")`.
- Integration tests hit a real database when possible — mocks lie about migrations.
