# DB Layer — `apps/api/src/db/`

All DynamoDB access goes through the `Storage` interface defined in `storage.ts`. Two implementations are selected at module load: the real `DynamoDBDocumentClient` impl (default) and an in-process `Map`-backed stub activated by `DDB_USE_STUB=1`. Set that env var in unit tests to skip Docker entirely.

Key shapes use a single-table-style composite key even though the tables are separate:
- Users (`looper_users`): `pk = USER#<uuid>`, `sk = PROFILE`, `gsi_email_pk = EMAIL#<email>`
- Loops (`looper_loops`): `pk = USER#<userId>`, `sk = LOOP#<loopId>`
- Sessions: `pk = SESSION#<token>`, `sk = DATA`

Email lookup uses the `gsi_email` GSI keyed on `gsi_email_pk`. Pass `indexName: "gsi_email"` and `keyAttr: "gsi_email_pk"` to `storage.queryByGsi`. Public loops use a `gsi_public` GSI: set `gsi_public_pk = "PUBLIC#1"` when `isPublic` becomes true; clear it on unpublish. Both GSIs are queried via `storage.queryByGsi`.

Uniqueness enforcement: pass `opts: { unique: { attribute: "gsi_email_pk" } }` to `storage.put`. The real impl uses `ConditionExpression: "attribute_not_exists(#u)"` and translates `ConditionalCheckFailedException` into `ConditionFailed`. The stub enforces the same constraint by scanning for duplicates. Callers (e.g. `users.ts`) catch `ConditionFailed` and rethrow as `DuplicateEmailError`.

`storage.update` requires the item to exist; it throws `NotFoundInStore` if the key is absent. `scanAll` and `truncate` are test/dev helpers — not for production code paths.
