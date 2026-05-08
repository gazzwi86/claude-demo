---METRICS---
config: c0
config_name: baseline
task: t4
task_name: loops_search
task_completed: yes

exploration_steps:
  - {step: 1, tool: Bash, target: "find packages/shared/src -type f", chars: 175, relevant: partial}
  - {step: 2, tool: Bash, target: "find apps/api/src -type f", chars: 418, relevant: partial}
  - {step: 3, tool: Read, target: "packages/shared/src/schemas.ts", chars: 2645, relevant: yes}
  - {step: 4, tool: Read, target: "apps/api/src/db/loops.ts", chars: 3825, relevant: yes}
  - {step: 5, tool: Read, target: "apps/api/src/services/loopService.ts", chars: 2777, relevant: yes}
  - {step: 6, tool: Read, target: "apps/api/src/routes/loops.ts", chars: 2403, relevant: yes}

totals:
  steps: 6
  chars_total: 12243
  chars_relevant: 11650
  chars_wasted: 593
  tokens_estimated: 3061

files_that_need_changing:
  - packages/shared/src/schemas.ts
  - apps/api/src/db/loops.ts
  - apps/api/src/services/loopService.ts
  - apps/api/src/routes/loops.ts

proposed_change: |
  Four files need changing. (1) packages/shared/src/schemas.ts: add
  `export const ListLoopsQuerySchema = z.object({ q: z.string().optional() })` and export
  its inferred type. (2) apps/api/src/db/loops.ts: add a `searchUserLoops(ownerId: string,
  query: string, limit = 50)` function that calls `listUserLoops` then filters results with
  `rows.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))` — DynamoDB Local
  does not support FilterExpression on non-key attributes efficiently, so client-side
  filtering after a full partition query is the correct approach given the small dataset
  and existing listUserLoops pattern. (3) apps/api/src/services/loopService.ts: add
  `searchLoopsForUser(ownerId, query)` that calls `searchUserLoops(ownerId, query)` and maps
  with `rowToPublic`. (4) apps/api/src/routes/loops.ts: modify the `GET /loops` handler to
  parse `request.query` via `ListLoopsQuerySchema`, and if `q` is present call
  `searchLoopsForUser` instead of `listLoopsForUser`.

---END METRICS---
