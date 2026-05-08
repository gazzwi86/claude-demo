---METRICS---
config: c1
config_name: anatomy
task: t5
task_name: effects_bypass
task_completed: yes

exploration_steps:
  - {step: 1, tool: Read, target: "docs/wiki/web-studio.md", chars: 2797, relevant: partial}
  - {step: 2, tool: Read, target: "apps/web/lib/audio/effects.ts", chars: 4380, relevant: yes}
  - {step: 3, tool: Read, target: "apps/web/components/studio/EffectsRack.tsx", chars: 3191, relevant: yes}

totals:
  steps: 3
  chars_total: 10368
  chars_relevant: 8368
  chars_wasted: 2000
  tokens_estimated: 2592

files_that_need_changing:
  - apps/web/lib/audio/effects.ts
  - apps/web/lib/audio/engine.ts
  - apps/web/components/studio/EffectsRack.tsx

proposed_change: |
  web-audio.md (in context from T1) described EffectsBus.setParams and the node wiring.
  web-studio.md confirmed EffectsRack component props (EffectsParams, onChange).
  Skipped engine.ts re-read — web-audio wiki described setEffects → bus.setParams chain.
  Same bypass implementation as C0. engine.ts skip saved 5,634 chars.

---END METRICS---
