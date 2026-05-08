---
name: Fastify Route Conventions
paths:
  - "apps/api/src/routes/**/*.ts"
---

## Fastify Route Rules

- Import Zod schemas from `@looper/shared` — don't define inline schemas
- Validate request body with `schema: { body: zodSchema }` in Fastify route options
- Authenticated routes call `request.jwtVerify()` (guard done by `authGuard` plugin)
- Return HTTP verbs: POST 201 + created object, GET 200, PATCH 200 + updated object, DELETE 204 (no body)
- Throw `AppError` subclasses (from `../errors.js`) — never raw `Error`
- No business logic in route handlers — delegate to `services/`
