---METRICS---
config: c0
config_name: baseline
task: t2
task_name: engine_playing_count
task_completed: yes

exploration_steps:
  - {step: 1, tool: Read, target: "apps/web/lib/audio/engine.ts", chars: 5634, relevant: yes}

totals:
  steps: 1
  chars_total: 5634
  chars_relevant: 5634
  chars_wasted: 0
  tokens_estimated: 1409

files_that_need_changing:
  - apps/web/lib/audio/engine.ts

proposed_change: |
  Add to AudioEngine class:

  getPlayingCount(): number {
    return this.padState.filter(s => s.playing).length;
  }

  getPadStates(): PadState[] {
    return this.padState.map(s => ({ ...s }));
  }

  Rationale: padState is PadState[] with a playing boolean per pad. Filter for playing=true.
  getPadStates returns shallow copies (spread) matching the existing getPadState(index) pattern.

---END METRICS---
