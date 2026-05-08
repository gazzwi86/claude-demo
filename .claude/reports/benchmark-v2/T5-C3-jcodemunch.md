---METRICS---
config: c3
config_name: jcodemunch
task: t5
task_name: effects_bypass
task_completed: yes

exploration_steps:
  - {step: 1, tool: jcodemunch/search_symbols, target: "EffectsBus EffectsParams effects.ts", chars: 400, relevant: yes}
  - {step: 2, tool: jcodemunch/get_symbol_source, target: "[EffectsBus#class, EffectsParams#type]", chars: 5200, relevant: yes}
  - {step: 3, tool: jcodemunch/search_symbols, target: "EffectsRack component", chars: 200, relevant: yes}
  - {step: 4, tool: jcodemunch/get_symbol_source, target: "EffectsRack#function", chars: 3400, relevant: yes}
  - {step: 5, tool: jcodemunch/search_symbols, target: "AudioEngine.setEffects method", chars: 200, relevant: yes}
  - {step: 6, tool: jcodemunch/get_symbol_source, target: "AudioEngine.setEffects#method", chars: 300, relevant: yes}

totals:
  steps: 6
  chars_total: 9700
  chars_relevant: 9700
  chars_wasted: 0
  tokens_estimated: 2425

files_that_need_changing:
  - apps/web/lib/audio/effects.ts
  - apps/web/lib/audio/engine.ts
  - apps/web/components/studio/EffectsRack.tsx

proposed_change: |
  Key win for engine.ts: instead of reading the entire 5,634 char file to find setEffects,
  got only the setEffects method body (~100 chars + ~200 char wrapper = 300 chars total).
  engine.ts savings: 5,634 - 300 = 5,334 chars saved.

  EffectsBus full class still needed (4,380 chars source, ~5,200 with wrapper) because
  the entire constructor wiring must be understood to add a bypass path.
  EffectsRack full component needed (~3,191 chars source, ~3,400 with wrapper) for JSX.

  Net: 9,700 vs baseline 13,205 = 26% reduction.
  Bypass change: same as C0 — add bypass to EffectsParams + setBypass method +
  disconnect/reconnect routing + EffectsRack toggle button.

---END METRICS---
