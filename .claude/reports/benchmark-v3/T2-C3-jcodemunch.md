---METRICS---
config: c3
config_name: jcodemunch
task: t2
task_name: engine_playing_count
task_completed: yes

exploration_steps:
  - {step: 1, tool: jcodemunch/get_symbol_source, target: "AudioEngine#class", chars: 4873, relevant: yes}

totals:
  steps: 1
  chars_total: 4873
  chars_relevant: 4873
  chars_wasted: 0
  tokens_estimated: 1218

files_that_need_changing:
  - apps/web/lib/audio/engine.ts

proposed_change: |
  Add get playingCount(): number { return this.padState.filter(s => s.playing).length; }
  to AudioEngine. padState.playing is set in togglePad/loadPadBuffer/unloadPad.

measurement_note: |
  Direct get_symbol_source (no search) — AudioEngine#class symbol ID known from T1
  context. Source: AudioEngine class lines 34-190 (~4,423 chars) + JSON overhead
  (~450 chars). Single-file task. No search step = no noise overhead.

---END METRICS---
