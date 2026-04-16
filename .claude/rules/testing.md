## Testing Rules

- Every new route handler must have a corresponding test file
- Use Node's built-in test runner (`node:test`) — no external test frameworks
- Tests must be deterministic — no random data, no network calls
- Always assert specific values, not just truthiness
