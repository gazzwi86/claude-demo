---METRICS---
config: c3
config_name: jcodemunch+language_filter
task: t5
task_name: effects_bypass
task_completed: yes
language_filter: typescript

exploration_steps:
  - {step: 1, tool: search_symbols, target: "EffectsBus EffectsParams EffectsRack bypass dry wet (lang=ts)", chars: 850, relevant: yes}
  - {step: 2, tool: get_symbol_source (batched), target: "EffectsBus + EffectsParams + DEFAULT_EFFECTS", chars: 4100, relevant: yes}
  - {step: 3, tool: Read, target: "components/studio/EffectsRack.tsx (full JSX needed for toggle insert)", chars: 3191, relevant: yes}

totals:
  steps: 3
  chars_total: 8141
  chars_relevant: 8141
  chars_wasted: 0
  tokens_estimated: 2035

files_that_need_changing:
  - apps/web/lib/audio/effects.ts
  - apps/web/components/studio/EffectsRack.tsx

proposed_change: |
  Same as C0.

quality:
  typecheck: pass
  tests_pass: yes
  oracle_pass: yes
  oracle_assertion: "see SPEC oracles"
  diff_vs_c0: identical
  divergence_note: ""

notes: |
  - Slight overhead vs C0 (8,141 vs 8,111). For the React component, full file Read
    is needed because UI inserts depend on JSX structure. jcodemunch returns
    function bodies, not file structure.
  - The class body (4,100 chars) was actually larger than the file Read (4,380)
    because get_symbol_source includes JSON envelope + every method signature.
  - For UI tasks specifically, jcodemunch loses its edge. Mixed audio + UI tasks
    end up at parity with C0.

---END METRICS---
