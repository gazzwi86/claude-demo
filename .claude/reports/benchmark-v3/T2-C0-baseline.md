---METRICS---
config: c0
config_name: baseline
task: t2
task_name: engine_playing_count
task_completed: yes

exploration_steps:
  - {step: 1, tool: Bash, target: "find apps/web/lib/audio -type f", chars: 319, relevant: partial}
  - {step: 2, tool: Read, target: "apps/web/lib/audio/engine.ts", chars: 5634, relevant: yes}

totals:
  steps: 2
  chars_total: 5953
  chars_relevant: 5634
  chars_wasted: 319
  tokens_estimated: 1488

files_that_need_changing:
  - apps/web/lib/audio/engine.ts

proposed_change: |
  Add a `playingCount` getter to AudioEngine that returns the count of pads where
  `padState[i].playing === true`. The implementation is
  `get playingCount(): number { return this.padState.filter(s => s.playing).length; }`.
  PadState is an interface defined at the top of engine.ts with a `playing: boolean` field.
  The internal `padState: PadState[]` array is already maintained by `togglePad`, `stopAll`,
  `loadPadBuffer`, and `unloadPad` — each sets `playing` correctly. No changes to PadState
  interface needed. If a `getPadStates()` shallow copy method is also required, add
  `getPadStates(): PadState[] { return this.padState.map(s => ({ ...s })); }`.

---END METRICS---
