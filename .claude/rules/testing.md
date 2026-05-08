---
name: Testing (global fallback)
---

## Testing Rules

Global fallback — applies repo-wide unless a more specific rule matches:

- Every new route handler must have a corresponding test file
- Use Node's built-in test runner (`node:test`) — no external test frameworks
- Tests must be deterministic — no random data, no network calls
- Always assert specific values, not just truthiness

**Area-specific rules override this file:**

- Fastify API tests → `testing-fastify.md` (paths: `apps/api/tests/**/*.test.ts`)
- React component tests → `testing-rtl.md` (paths: `apps/web/**/*.test.tsx`, `apps/web/**/*.spec.tsx`)
