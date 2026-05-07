# @looper/api — conventions

Fastify + AWS SDK v3 service. Stores users, loops, sessions in DynamoDB
and audio blobs in S3. **Local-only**: hits DynamoDB Local + LocalStack
in dev/test; never reaches real AWS in CI.

## Layout

- `src/server.ts` — Fastify factory + `main()` entrypoint
- `src/config.ts` — env var loading + defaults
- `src/routes/` — one file per resource: `auth.ts`, `loops.ts`, `sessions.ts`, `health.ts`
- `src/services/` — business logic — auth, loops, S3 presigned URLs
- `src/db/` — DynamoDB DocumentClient wrappers — `users.ts`, `loops.ts`, `sessions.ts`
- `src/middleware/` — `authGuard.ts`, `errorHandler.ts`
- `tests/` — Vitest, uses `light-my-request` via Fastify's `app.inject()`

## Conventions

- ESM only. `.js` extension on relative imports.
- Validate every body/query/params with a schema from `@looper/shared`. Don't redefine.
- DynamoDB access via `@aws-sdk/lib-dynamodb` `DynamoDBDocumentClient`. Single-table
  patterns aren't used — three small tables (users/loops/sessions).
- Auth via JWT in an `httpOnly` cookie named `looper_auth`. Verify in `authGuard`.
- S3 access only via presigned URLs returned to the client. The API never
  proxies bytes.
- Tests must not hit real AWS. They use the `awslocal` endpoints via env
  vars set by docker-compose.
- Errors thrown in routes pass through `errorHandler` middleware which maps
  known `AppError` instances to status codes.
