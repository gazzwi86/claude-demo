---METRICS---
config: c0
config_name: baseline
task: t3
task_name: loop_tags
task_completed: yes

exploration_steps:
  - {step: 1, tool: Bash, target: "find packages/shared/src -type f", chars: 175, relevant: partial}
  - {step: 2, tool: Bash, target: "find apps/api/src -type f", chars: 418, relevant: partial}
  - {step: 3, tool: Read, target: "packages/shared/src/schemas.ts", chars: 2645, relevant: yes}
  - {step: 4, tool: Read, target: "apps/api/src/db/loops.ts", chars: 3825, relevant: yes}

totals:
  steps: 4
  chars_total: 7063
  chars_relevant: 6470
  chars_wasted: 593
  tokens_estimated: 1766

files_that_need_changing:
  - packages/shared/src/schemas.ts
  - apps/api/src/db/loops.ts

proposed_change: |
  In packages/shared/src/schemas.ts, add `tags: z.array(z.string()).max(10).optional()` to
  both CreateLoopSchema and UpdateLoopSchema. In apps/api/src/db/loops.ts, add `tags?:
  string[]` to the NewLoopInput interface, include `tags: input.tags ?? []` in the row
  object inside createLoop(), and in updateLoop() add handling for `updates.tags` with
  `if (updates.tags !== undefined) next.tags = updates.tags`. The LoopRow extends LoopMeta
  from @looper/shared, so LoopMeta in packages/shared/src/schemas.ts (the LoopMetaSchema)
  would also need `tags: z.array(z.string()).optional()` added for the response type to
  carry tags through. The DynamoDB storage layer uses generic Record<string, unknown> so
  no storage.ts changes are needed.

---END METRICS---
