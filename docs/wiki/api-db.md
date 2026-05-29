# api-db

_Area: `apps/api/src/db/` — DynamoDB table wrappers_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/api/src/db/storage.ts

**Description:** Storage abstraction over DynamoDB. Two implementations selected at module load via `DDB_USE_STUB=1`: a real `DynamoDBDocumentClient` (against DynamoDB Local or AWS), and an in-process `Map`-based stub for fast tests without Docker. Both satisfy the `Storage` interface.

### Exports

- **`interface Storage`** — put, get, queryByGsi, queryByPartition, update, delete, scanAll, truncate
- **`storage: Storage`** — module-level singleton; real DDB or stub based on env
- **`isStubStorage: boolean`** — true when running against the in-process stub
- **`class ConditionFailed`** — thrown when a `put` with `unique` option detects a duplicate attribute value
- **`class NotFoundInStore`** — thrown when `update` targets a non-existent item

### Key methods

- **`put(table, item, opts?)`** — writes item; `opts.unique.attribute` adds a `attribute_not_exists` ConditionExpression
- **`get(table, key)`** — fetches by `{ pk, sk }`, returns item or null
- **`queryByGsi(table, indexName, keyAttr, keyValue, opts?)`** — KeyConditionExpression on a GSI; supports limit and sort direction
- **`queryByPartition(table, pk, opts?)`** — partition key query with optional `skBeginsWith` prefix filter
- **`update(table, key, attrs)`** — partial attribute update with `ReturnValues: ALL_NEW`; asserts `attribute_exists(pk)` to surface NotFound
- **`delete / scanAll / truncate`** — standard delete; scan and truncate are test/dev helpers only

---

## apps/api/src/db/users.ts

**Description:** Typed wrapper for the users DynamoDB table. Key schema: `pk = "USER#<id>"`, `sk = "PROFILE"`. GSI `gsi_email` is keyed on `gsi_email_pk = "EMAIL#<email>"` for email-based lookups without scanning.

### Exports

- **`interface UserRow`** — full row shape: pk, sk, gsi_email_pk, id, email, displayName, passwordHash, createdAt
- **`createUser(input)`** — generates UUID, writes row with uniqueness check on gsi_email_pk; throws DuplicateEmailError on conflict
- **`getUserById(id)`** — gets by pk/sk key; returns UserRow or null
- **`getUserByEmail(email)`** — queries gsi_email GSI; returns UserRow or null
- **`userKey(id)`** — helper returning `{ pk: "USER#id", sk: "PROFILE" }`
- **`_truncateUsers()`** — test helper; truncates the users table

### Depends on

- `./storage.js`
- `../config.js`
- `../errors.js` (DuplicateEmailError)

---

## apps/api/src/db/CLAUDE.md

**Description:** Convention doc for the DB layer. Covers the composite key schema for all three tables, GSI access patterns for email and public-loop queries, uniqueness enforcement via `attribute_not_exists` ConditionExpression, and the `DDB_USE_STUB=1` in-process stub pattern for unit tests.

---

## apps/api/src/db/loops.ts

**Description:** Typed wrapper for the loops DynamoDB table. Key schema: `pk = "USER#<ownerId>"`, `sk = "LOOP#<loopId>"`. GSI `gsi_public` is keyed on `gsi_public_pk = "PUBLIC#1"` for queries across all public loops regardless of owner. The S3 object key is derived per-loop via `s3KeyFor` as `users/<ownerId>/loops/<loopId>.<ext>`.

### Exports

- **`interface LoopRow`** — full row shape: pk, sk, optional gsi_public_pk, and all LoopMeta fields
- **`interface NewLoopInput`** — input type for `createLoop`: ownerId, name, durationMs, sampleRate, bpm, mimeType, sizeBytes
- **`loopKey(ownerId, loopId)`** — returns `{ pk: "USER#<ownerId>", sk: "LOOP#<loopId>" }`
- **`s3KeyFor(ownerId, loopId, mimeType)`** — derives S3 object key: `users/<ownerId>/loops/<loopId>.<ext>`
- **`createLoop(input)`** — generates UUID, derives s3Key, writes loop row; isPublic defaults to false
- **`getLoop(ownerId, loopId)`** — fetches by pk/sk; returns LoopRow or null
- **`getLoopOrThrow(ownerId, loopId)`** — fetches by pk/sk; throws NotFoundError if absent
- **`listUserLoops(ownerId, limit?)`** — queries partition key with `sk` prefix `LOOP#`; sorted desc; default limit 50
- **`listPublicLoops(limit?)`** — queries gsi_public GSI for `gsi_public_pk = "PUBLIC#1"`; sorted desc; default limit 50
- **`updateLoop(ownerId, loopId, updates)`** — partial update of name, bpm, isPublic; sets/clears gsi_public_pk based on isPublic
- **`deleteLoop(ownerId, loopId)`** — deletes the loop row
- **`_truncateLoops()`** — test helper

### Depends on

- `./storage.js`
- `../config.js`
- `../errors.js` (NotFoundError)
