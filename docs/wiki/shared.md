# shared

_Area: `packages/shared/src/` — cross-package zod schemas + types_

_Last full refresh: 2026-05-08T14:00:00Z_

## packages/shared/src/schemas.ts

**Description:** Every cross-package request/response Zod schema shared by `@looper/web` and `@looper/api`. Single source of truth — schemas are never duplicated or re-defined on either side. All API body validation imports from here.

### Exports (primitive schemas)

- **`EmailSchema`** — string, trimmed, lowercased, valid email, max 254 chars
- **`PasswordSchema`** — string, 8–200 chars
- **`DisplayNameSchema`** — string, trimmed, 1–60 chars
- **`LoopNameSchema`** — string, trimmed, 1–80 chars

### Exports (composite schemas)

- **`SignupSchema`** — email + password + displayName
- **`LoginSchema`** — email + password
- **`PublicUserSchema`** — id, email, displayName, createdAt
- **`CreateLoopSchema`** — name, durationMs, sampleRate, bpm (nullable/optional), mimeType (enum from ALLOWED_LOOP_MIMES), sizeBytes
- **`UpdateLoopSchema`** — partial: name, bpm, isPublic
- **`LoopMetaSchema`** — full loop metadata shape including s3Key, bpm, isPublic, mimeType, sizeBytes, timestamps
- **`PadConfigSchema`** — loopId, volume (0–1), mute, solo, playbackRate (0.25–4), filterCutoff (20–20000)
- **`SessionConfigSchema`** — id, ownerId, name, pads[PAD_GRID_SIZE], master object (volume, delayMs, delayFeedback, delayMix, reverbMix)

### Exports (inferred types)

- **`Signup`**, **`Login`**, **`CreateLoop`**, **`UpdateLoop`** — TypeScript types inferred via `z.infer`

### Depends on

- `zod`
- `./constants.js` (ALLOWED_LOOP_MIMES, MAX_LOOP_BYTES, MAX_LOOP_DURATION_MS, PAD_GRID_SIZE)

---

## packages/shared/src/types.ts

**Description:** TypeScript interface definitions for domain objects. Separated from schemas so consumers can do type-only imports without pulling in zod at runtime.

### Exports

- **`UserId`**, **`LoopId`**, **`SessionId`** — string type aliases
- **`PublicUser`** — id, email, displayName, createdAt
- **`LoopMeta`** — full loop metadata: id, ownerId, name, s3Key, durationMs, sampleRate, bpm, isPublic, mimeType, sizeBytes, createdAt, updatedAt
- **`PadConfig`** — per-pad state: loopId (nullable), volume, mute, solo, playbackRate, filterCutoff
- **`SessionConfig`** — full saved session: id, ownerId, name, pads[], master effects object

---

## packages/shared/src/constants.ts

**Description:** Domain constants shared between web and API. Import directly from `@looper/shared`.

### Exports

- **`PAD_GRID_SIZE`** — 16 (4×4 grid)
- **`MAX_LOOP_DURATION_MS`** — maximum loop duration constraint used in CreateLoopSchema
- **`MAX_LOOP_BYTES`** — maximum upload size constraint
- **`ALLOWED_LOOP_MIMES`** — const tuple of permitted audio MIME types (`audio/webm`, `audio/webm;codecs=opus`, `audio/ogg;codecs=opus`, `audio/mp4`)

---

## packages/shared/src/index.ts

**Description:** Re-exports all public symbols from schemas, types, and constants. This is the `@looper/shared` package entry point.

---

## packages/shared/src/schemas.test.ts

**Description:** 12 Vitest contract tests verifying that each schema accepts valid inputs and rejects invalid ones. Acts as a living spec — if a schema boundary changes, these tests break first.

