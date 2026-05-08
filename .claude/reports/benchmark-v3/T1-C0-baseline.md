---METRICS---
config: c0
config_name: baseline
task: t1
task_name: padnode_fadein
task_completed: yes

exploration_steps:
  - {step: 1, tool: Bash, target: "find apps/web/lib/audio -type f", chars: 319, relevant: partial}
  - {step: 2, tool: Read, target: "apps/web/lib/audio/padNode.ts", chars: 3086, relevant: yes}

totals:
  steps: 2
  chars_total: 3405
  chars_relevant: 3086
  chars_wasted: 319
  tokens_estimated: 851

files_that_need_changing:
  - apps/web/lib/audio/padNode.ts

proposed_change: |
  Add a `fadeIn(durationSecs: number): void` method to PadNode. The method should
  check `if (!this.playing) return;`, then set `this.gain.gain.setValueAtTime(0,
  this.ctx.currentTime)` followed by `this.gain.gain.linearRampToValueAtTime(
  this.currentVolume, this.ctx.currentTime + durationSecs)`. This works because PadNode
  already has `this.gain` (a GainNode), `this.currentVolume` (the target volume level),
  `this.ctx` (the AudioContext), and `this.playing` (the playing flag) — all private
  fields defined in the constructor. The pattern matches the existing `setMuted` and
  `setVolume` methods which also manipulate `this.gain.gain` via AudioParam scheduling.

---END METRICS---
