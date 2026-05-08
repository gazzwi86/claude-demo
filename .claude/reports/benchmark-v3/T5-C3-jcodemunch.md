---METRICS---
config: c3
config_name: jcodemunch
task: t5
task_name: effects_bypass
task_completed: yes

exploration_steps:
  - {step: 1, tool: jcodemunch/get_symbol_source, target: "[EffectsBus#class, EffectsRack#function]", chars: 8040, relevant: yes}

totals:
  steps: 1
  chars_total: 8040
  chars_relevant: 8040
  chars_wasted: 0
  tokens_estimated: 2010

files_that_need_changing:
  - apps/web/lib/audio/effects.ts
  - apps/web/components/studio/EffectsRack.tsx

proposed_change: |
  effects.ts: add bypass: boolean to EffectsParams; in EffectsBus.setParams when
  bypass=true, disconnect input from preFilter and connect input directly to master;
  when false, reconnect normal path. EffectsRack.tsx: add bypass toggle button at
  rack top level.
  engine.ts: setEffects already delegates to bus.setParams — no change needed
  (understood from T2 context).

measurement_note: |
  Direct batch get_symbol_source (no search). EffectsBus#class and EffectsRack#function
  symbol IDs known from task description. EffectsBus (lines 26-129, ~3,640 chars source)
  + EffectsRack (lines 11-95, ~3,400 chars source) = 7,040 source + 2x JSON overhead
  (900) + batch wrapper (100) = 8,040 chars. engine.ts not re-read (setEffects
  established in T2). 2-file task with no search overhead.

---END METRICS---
