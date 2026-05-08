---METRICS---
config: c3
config_name: jcodemunch
task: t4
task_name: loops_search
task_completed: yes

exploration_steps:
  - {step: 1, tool: jcodemunch/search_symbols, target: "listUserLoops listLoopsForUser loops route GET", chars: 900, relevant: yes}
  - {step: 2, tool: jcodemunch/get_symbol_source, target: "[listUserLoops, listLoopsForUser, loopsRoutes]", chars: 3190, relevant: yes}

totals:
  steps: 2
  chars_total: 4090
  chars_relevant: 3940
  chars_wasted: 150
  tokens_estimated: 1023

files_that_need_changing:
  - packages/shared/src/schemas.ts
  - apps/api/src/db/loops.ts
  - apps/api/src/services/loopService.ts
  - apps/api/src/routes/loops.ts

proposed_change: |
  schemas.ts: add ListLoopsQuerySchema with q?: z.string().optional().
  routes.ts: parse querystring q, pass to listLoopsForUser.
  loopService.ts: accept q param, filter in-memory (or pass to db).
  loops.ts (db): accept q param in listUserLoops, filter rows where name
  includes q (case-insensitive) after DynamoDB query.

measurement_note: |
  search_symbols 6 results: 5 relevant (listLoopsForUser, listUserLoops,
  listPublicLoopsView partial, listPublicLoops partial, getLoopForViewer partial),
  1 noise (aliceList test constant). Batch get_symbol_source: listUserLoops (~200)
  + listLoopsForUser (~90) + loopsRoutes (~1,400) = 1,690 source + 3x JSON (1,350)
  + wrapper (150) = 3,190 chars. schemas.ts fourth file identified from route
  handler (uses CreateLoopSchema/UpdateLoopSchema inline — ListLoopsQuerySchema
  needs adding).

---END METRICS---
