---METRICS---
config: c0
config_name: baseline
task: t4
task_name: loops_search
task_completed: yes

exploration_steps:
  - {step: 1, tool: Glob, target: "apps/api/src/routes/*.ts", chars: 210, relevant: yes}
  - {step: 2, tool: Read, target: "apps/api/src/routes/loops.ts", chars: 2403, relevant: yes}
  - {step: 3, tool: Read, target: "apps/api/src/services/loopService.ts", chars: 2777, relevant: yes}
  - {step: 4, tool: Read, target: "apps/api/src/db/loops.ts", chars: 3825, relevant: yes}
  - {step: 5, tool: Read, target: "packages/shared/src/schemas.ts", chars: 2645, relevant: yes}

totals:
  steps: 5
  chars_total: 11860
  chars_relevant: 11860
  chars_wasted: 0
  tokens_estimated: 2965

files_that_need_changing:
  - packages/shared/src/schemas.ts
  - apps/api/src/db/loops.ts
  - apps/api/src/services/loopService.ts
  - apps/api/src/routes/loops.ts

proposed_change: |
  // packages/shared/src/schemas.ts
  export const LoopSearchQuerySchema = z.object({
    q: z.string().min(1).max(100),
  });

  // apps/api/src/db/loops.ts
  export async function searchUserLoops(ownerId: string, query: string, limit = 50): Promise<LoopRow[]> {
    const all = await listUserLoops(ownerId, 200);
    const q = query.toLowerCase();
    return all.filter(r => r.name.toLowerCase().includes(q)).slice(0, limit);
  }

  // apps/api/src/services/loopService.ts
  import { LoopSearchQuerySchema, searchUserLoops } from ...
  export async function searchLoopsForUser(ownerId: string, query: string): Promise<LoopMeta[]> {
    const rows = await searchUserLoops(ownerId, query);
    return rows.map(rowToPublic);
  }

  // apps/api/src/routes/loops.ts
  import { LoopSearchQuerySchema } from "@looper/shared";
  import { searchLoopsForUser } from "../services/loopService.js";
  app.get("/loops/search", { preHandler: authGuard }, async (request) => {
    const parsed = LoopSearchQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());
    const loops = await searchLoopsForUser(request.user!.id, parsed.data.q);
    return { loops };
  });

---END METRICS---
