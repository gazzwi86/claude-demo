---
name: Security
---

## Security Rules

- Never hardcode API keys, tokens, or passwords in source files
- Always validate and sanitize user input at route boundaries
- Use `sanitizeInput()` from `src/utils/validate.js` for string inputs
- Never use `eval()` or `Function()` constructors
- Do not log sensitive data (passwords, tokens, PII)
