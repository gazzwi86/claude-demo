---METRICS---
config: c0
config_name: baseline
task: t1
task_name: padnode_fadein
task_completed: yes

exploration_steps:
  - {step: 1, tool: Read, target: "apps/web/lib/audio/padNode.ts", chars: 3086, relevant: yes}

totals:
  steps: 1
  chars_total: 3086
  chars_relevant: 3086
  chars_wasted: 0
  tokens_estimated: 772

files_that_need_changing:
  - apps/web/lib/audio/padNode.ts

proposed_change: |
  Add to PadNode class:

  fadeIn(durationMs: number): void {
    if (!this.playing) return;
    const now = this.ctx.currentTime;
    this.gain.gain.setValueAtTime(0, now);
    this.gain.gain.linearRampToValueAtTime(this.currentVolume, now + durationMs / 1000);
  }

  Rationale: gain is managed via this.gain (GainNode). this.currentVolume holds the
  target. While playing, ramp from 0 to currentVolume over durationMs/1000 seconds.
  When not playing, return immediately (this.playing guard).

---END METRICS---
