---METRICS---
config: c0
config_name: baseline
task: t5
task_name: effects_bypass
task_completed: yes

exploration_steps:
  - {step: 1, tool: Read, target: "apps/web/lib/audio/effects.ts", chars: 4380, relevant: yes}
  - {step: 2, tool: Read, target: "apps/web/lib/audio/engine.ts", chars: 5634, relevant: yes}
  - {step: 3, tool: Read, target: "apps/web/components/studio/EffectsRack.tsx", chars: 3191, relevant: yes}

totals:
  steps: 3
  chars_total: 13205
  chars_relevant: 13205
  chars_wasted: 0
  tokens_estimated: 3301

files_that_need_changing:
  - apps/web/lib/audio/effects.ts
  - apps/web/lib/audio/engine.ts
  - apps/web/components/studio/EffectsRack.tsx

proposed_change: |
  // effects.ts — add bypass to EffectsParams
  export interface EffectsParams {
    // ...existing fields...
    bypass: boolean;  // ADD: true = route input directly to master, skip filter/delay/reverb
  }
  export const DEFAULT_EFFECTS: EffectsParams = { ..., bypass: false };

  // EffectsBus — add setBypass method
  setBypass(bypass: boolean): void {
    if (bypass) {
      try { this.input.disconnect(this.preFilter); } catch {}
      this.input.connect(this.master);
    } else {
      try { this.input.disconnect(this.master); } catch {}
      this.input.connect(this.preFilter);
    }
  }

  // Update setParams to call setBypass when bypass changes:
  if (p.bypass !== undefined) this.setBypass(p.bypass);

  // engine.ts — DEFAULT_EFFECTS already sourced from effects.ts, no change needed.
  // setEffects already forwards to bus.setParams(p), so bypass propagates automatically.

  // EffectsRack.tsx — add bypass toggle button in JSX
  <button
    onClick={() => onChange({ bypass: !effects.bypass })}
    aria-label="Bypass effects"
    className={...}
  >
    {effects.bypass ? "Bypassed" : "Bypass"}
  </button>

---END METRICS---
