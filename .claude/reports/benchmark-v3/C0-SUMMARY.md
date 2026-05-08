# Benchmark v3 — C0 (baseline) Summary

Config: c0 — baseline (Read + Bash grep/find only; no graphify, no ANATOMY/wiki, no jcodemunch)

## Per-task totals

| Task | Name | Steps | chars_total | chars_relevant | chars_wasted | tokens_estimated |
|------|------|-------|-------------|----------------|--------------|------------------|
| T1 | padnode_fadein | 2 | 3,405 | 3,086 | 319 | 851 |
| T2 | engine_playing_count | 2 | 5,953 | 5,634 | 319 | 1,488 |
| T3 | loop_tags | 4 | 7,063 | 6,470 | 593 | 1,766 |
| T4 | loops_search | 6 | 12,243 | 11,650 | 593 | 3,061 |
| T5 | effects_bypass | 5 | 13,834 | 13,205 | 629 | 3,459 |

## Aggregate

- **Total chars across all 5 tasks**: 42,498
- **Total chars relevant**: 40,045
- **Total chars wasted**: 2,453 (5.8%)
- **Total tokens_estimated**: 10,625

## Notes

- All exploration was direct file reads + find commands. No indirect navigation needed.
- The find commands at the start of each task were the main source of wasted chars (listing
  all files in a directory to orient, then reading only the relevant ones).
- T1 and T2 both read engine.ts and padNode.ts — in a real sequential run the second read
  would be cached. These totals count each read independently as the spec requires.
- T3 and T4 share schemas.ts and loops.ts reads — same caveat applies.
- The codebase is well-structured: single-responsibility files meant every task required
  reading at most 2-3 files to get full context.
