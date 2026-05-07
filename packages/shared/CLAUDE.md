# @looper/shared — conventions

Tiny package. **Zero runtime deps except `zod`.** No Node-specific or
browser-specific APIs — must be importable from both `apps/api` and
`apps/web`.

- All cross-package contracts live here: zod schemas, inferred TS types,
  domain constants. Both web and api import from `@looper/shared`.
- New endpoint? Add the request + response schema here first, then
  import it on both sides.
- ESM only. `.js` extensions in relative imports (TS treats them as the
  TS source via NodeNext / Bundler resolution).
- No I/O, no `process.env`, no `fetch`. Pure types and validation.
- Tests are colocated under `src/` as `*.test.ts` and run via Vitest.
