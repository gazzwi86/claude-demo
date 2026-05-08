---METRICS---
config: c0
config_name: baseline
task: t3
task_name: loop_tags
task_completed: yes

exploration_steps:
  - {step: 1, tool: Read, target: "packages/shared/src/schemas.ts", chars: 2645, relevant: yes}
  - {step: 2, tool: Grep, target: "NewLoopInput in apps/api/src/db/", chars: 180, relevant: yes}
  - {step: 3, tool: Read, target: "apps/api/src/db/loops.ts", chars: 3825, relevant: yes}

totals:
  steps: 3
  chars_total: 6650
  chars_relevant: 6650
  chars_wasted: 0
  tokens_estimated: 1663

files_that_need_changing:
  - packages/shared/src/schemas.ts
  - apps/api/src/db/loops.ts

proposed_change: |
  // packages/shared/src/schemas.ts
  export const CreateLoopSchema = z.object({
    name: LoopNameSchema,
    durationMs: z.number().int().positive().max(MAX_LOOP_DURATION_MS),
    sampleRate: z.number().int().positive().max(192_000),
    bpm: z.number().positive().max(300).nullable().optional(),
    mimeType: z.enum(ALLOWED_LOOP_MIMES),
    sizeBytes: z.number().int().positive().max(MAX_LOOP_BYTES),
    tags: z.array(z.string()).max(10).optional(),  // ADD
  });

  export const UpdateLoopSchema = z.object({
    name: LoopNameSchema.optional(),
    bpm: z.number().positive().max(300).nullable().optional(),
    isPublic: z.boolean().optional(),
    tags: z.array(z.string()).max(10).optional(),  // ADD
  });

  // apps/api/src/db/loops.ts - NewLoopInput
  export interface NewLoopInput {
    ownerId: string; name: string; durationMs: number;
    sampleRate: number; bpm: number | null; mimeType: string;
    sizeBytes: number;
    tags?: string[];  // ADD
  }

  // createLoop: add tags: input.tags ?? [] to row
  // updateLoop: add if (updates.tags !== undefined) next.tags = updates.tags;

---END METRICS---
