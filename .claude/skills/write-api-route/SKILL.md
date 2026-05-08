---
name: write-api-route
description: Guide for adding a new API endpoint to the Fastify backend. Invoke when the user says "add endpoint", "create route", "implement API for X", or "add a new API route".
---

# Add a new API route

Follow these steps in order. Each layer must exist before the next.

## Step 1 — Define the Zod schema

File: `packages/shared/src/schemas.ts`

Add request and response schemas:

```ts
export const CreateFooRequest = z.object({ ... });
export const FooResponse = z.object({ ... });
```

## Step 2 — Export the types

File: `packages/shared/src/index.ts`

Export the new schemas and their inferred types:

```ts
export { CreateFooRequest, FooResponse } from "./schemas.js";
export type { ... } from "./schemas.js";
```

## Step 3 — Add the route handler

File: `apps/api/src/routes/<area>.ts`

Use the shared schemas in the Fastify `schema:` option:

```ts
import { CreateFooRequest, FooResponse } from "@looper/shared";

fastify.post("/foo", {
  schema: {
    body: CreateFooRequest,
    response: { 201: FooResponse },
  },
  handler: async (req, reply) => {
    const result = await fooService.create(req.body);
    return reply.status(201).send(result);
  },
});
```

## Step 4 — Implement the service

File: `apps/api/src/services/<area>Service.ts`

Delegate all business logic here. The route handler should contain no business logic — only schema validation, calling the service, and sending the response.

## Step 5 — Add DB operations (if needed)

File: `apps/api/src/db/<table>.ts`

Follow the abstraction pattern in `storage.ts`. Use the `DocumentClient` wrappers; do not call DynamoDB directly from service files.

## Step 6 — Write a test

Follow `/write-vitest-test` to create `apps/api/tests/<area>.test.ts`. Use `app.inject()` to test the route end-to-end.

## HTTP status conventions

| Method | Success status |
|---|---|
| POST | 201 |
| GET | 200 |
| PATCH | 200 |
| DELETE | 204 (no body) |

## Checklist before finishing

- [ ] Zod schemas added to `packages/shared/src/schemas.ts`
- [ ] Types exported from `packages/shared/src/index.ts`
- [ ] Route handler uses shared schemas in `schema:` option
- [ ] Business logic delegated to service layer
- [ ] DB operations in `db/<table>.ts` if needed
- [ ] Test written with `app.inject()`
- [ ] Correct HTTP status code used
