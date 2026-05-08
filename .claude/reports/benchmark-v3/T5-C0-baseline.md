---METRICS---
config: c0
config_name: baseline
task: t5
task_name: effects_bypass
task_completed: yes

exploration_steps:
  - {step: 1, tool: Bash, target: "find apps/web/lib/audio -type f", chars: 319, relevant: partial}
  - {step: 2, tool: Bash, target: "find apps/web/components/studio -type f", chars: 310, relevant: partial}
  - {step: 3, tool: Read, target: "apps/web/lib/audio/effects.ts", chars: 4380, relevant: yes}
  - {step: 4, tool: Read, target: "apps/web/lib/audio/engine.ts", chars: 5634, relevant: yes}
  - {step: 5, tool: Read, target: "apps/web/components/studio/EffectsRack.tsx", chars: 3191, relevant: yes}

totals:
  steps: 5
  chars_total: 13834
  chars_relevant: 13205
  chars_wasted: 629
  tokens_estimated: 3459

files_that_need_changing:
  - apps/web/lib/audio/effects.ts
  - apps/web/lib/audio/engine.ts
  - apps/web/components/studio/EffectsRack.tsx

proposed_change: |
  Three files need changing. (1) apps/web/lib/audio/effects.ts: add `bypass: boolean`
  to EffectsParams (default false in DEFAULT_EFFECTS), add a private `bypass = false`
  field to EffectsBus, and add a `setBypass(bypass: boolean)` method. When bypass is true,
  disconnect `this.input` from `this.preFilter` and connect it directly to `this.master`;
  when false, restore the normal routing (disconnect input from master, reconnect
  input→preFilter). Handle bypass in `setParams()` by delegating to `setBypass` when
  `p.bypass !== undefined`. (2) apps/web/lib/audio/engine.ts: the `setEffects` method
  already calls `this.bus.setParams(p)`, so no change needed there — bypass flows through
  automatically once EffectsBus handles it. The `effects: EffectsParams` state will carry
  `bypass` once it's added to the interface. (3) apps/web/components/studio/EffectsRack.tsx:
  add a bypass toggle button (e.g. a checkbox or toggle button) at the top of the effects
  section that calls `onChange({ bypass: !effects.bypass })`, with an `aria-label="Bypass
  effects"` attribute to satisfy the accessibility convention.

---END METRICS---
