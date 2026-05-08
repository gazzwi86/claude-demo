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

## apps/api/src/db/loops.ts

**Description:** Typed wrapper for the loops DynamoDB table. Key schema: `pk = "USER#<ownerId>"`, `sk = "LOOP#<loopId>"`. GSI `gsi_public` is keyed on `gsi_public_pk = "PUBLIC"` for queries across all public loops regardless of owner.

### Exports

- **`interface LoopRow`** — full row shape including pk, sk, gsi_public_pk and all LoopMeta fields
- **`createLoop(input)`** — generates UUID + s3Key (`loops/<uuid>`), writes loop row
- **`getLoopOrThrow(ownerId, loopId)`** — fetches by pk/sk; throws NotFoundError if absent
- **`listUserLoops(ownerId)`** — queries by partition key sorted by createdAt desc
- **`listPublicLoops()`** — queries gsi_public GSI for all loops with gsi_public_pk = "PUBLIC"
- **`updateLoop(ownerId, loopId, patch)`** — partial update of name, bpm, isPublic; toggles gsi_public_pk based on isPublic
- **`deleteLoop(ownerId, loopId)`** — deletes the loop row
- **`_truncateLoops()`** — test helper

### Depends on

- `./storage.js`
- `../config.js`
- `../errors.js` (NotFoundError)
