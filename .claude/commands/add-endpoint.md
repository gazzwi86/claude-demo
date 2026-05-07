---
description: Scaffold a new REST endpoint (Fastify route in apps/api or Next.js route handler in apps/web) with shared zod schema and Vitest test
arguments:
  - name: target
    description: 'Either "api" (Fastify route in apps/api) or "web" (Next.js route handler in apps/web)'
    required: true
  - name: resource
    description: The resource name (e.g. "loops", "comments")
    required: true
---

Scaffold a new REST endpoint for the "$ARGUMENTS.resource" resource on target "$ARGUMENTS.target".

If target is **api** (default for backend resources):
1. Add or extend the request/response zod schemas in `packages/shared/src/schemas.ts`. Re-export from `packages/shared/src/index.ts`.
2. Create `apps/api/src/routes/$ARGUMENTS.resource.ts` with a Fastify plugin exporting `default async function (app)` that registers GET (list) and POST (create) handlers, both validating bodies/queries with the shared zod schemas via `safeParse`.
3. If a service layer is appropriate, add `apps/api/src/services/$ARGUMENTS.resource.ts` with the business logic; the route file imports from it.
4. Register the route plugin in `apps/api/src/server.ts` via `await app.register(...)`.
5. Add `apps/api/tests/$ARGUMENTS.resource.test.ts` covering the happy path, an auth-failure case (if authed), and a validation-failure case. Use `app.inject()` against a `buildServer()` instance.
6. Run `pnpm -F @looper/api test` to verify.

If target is **web**:
1. Add or extend zod schemas in `packages/shared/src/schemas.ts`.
2. Create `apps/web/app/api/$ARGUMENTS.resource/route.ts` exporting `GET` / `POST` handlers as appropriate.
3. Add `apps/web/tests/api/$ARGUMENTS.resource.test.ts` using Vitest + Fetch API.
4. Run `pnpm -F @looper/web test`.

Conventions:
- ESM only. `.js` extensions on relative TS imports.
- All validation goes through `@looper/shared` schemas — never redefine.
- Errors thrown in handlers pass through the `errorHandler` middleware (api) or are mapped to NextResponse status codes (web).
