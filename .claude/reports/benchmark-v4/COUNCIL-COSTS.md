# Benchmark v4 — Council Token Costs

Methodology: each council persona ran as a parallel background sub-agent. Sub-agent
runtime reports `total_tokens`, `tool_uses`, and `duration_ms` on completion. Numbers
captured from notification messages; cross-referenced with file sizes of each output.

## Per-persona costs

| Persona | total_tokens | tool_uses | duration_ms |
|---------|-------------:|----------:|------------:|
| P1 Boris Cherney  | 40,941 |  6 | 50,082 |
| P2 Andrej Karpathy | 39,945 |  6 | 42,503 |
| P3 Junior dev     | 35,773 |  3 | 27,714 |
| P4 Senior dev     | 37,200 |  4 | 39,694 |
| P5 Security       | 39,485 |  4 | 47,614 |
| P6 ML-infra       | 41,560 |  6 | 45,364 |
| **Total**         | **234,904** | **29** | wall ~50s parallel |

## ROI accounting

Benchmark v4 savings (sum across T1-T5 vs C0):

| Config | Saving (chars) | Saving (tokens, /4) |
|--------|---------------:|--------------------:|
| C3 | 13,100 | 3,275 |
| C3b | 16,620 | 4,155 |
| C8 | 6,654 | 1,663 |
| **Best-config saving per run** | **16,620** | **4,155** |

**Council cost: 234,904 tokens.** **Per-run best-config saving: 4,155 tokens.**

| Cycles to break even | Council cost / saving per cycle |
|---------------------:|--------------------------------:|
| 56 | 234,904 / 4,155 |

For council to be net-positive, the team must run **>56 benchmark cycles** at the
current scope, OR the council findings must drive architecture changes whose
savings exceed the council cost.

## Findings cost-effectiveness

The v4 council DID identify architecture-level changes (C1, C2, C5 from COUNCIL.md):

- **C1 staleness hook**: prevents post-edit accuracy bugs in *every future agent
  session*. If even 1% of agent sessions would have used stale data, this saves
  far more than 235k tokens of debugging.
- **C2 C3b default**: changes the per-task token spend permanently. Saves
  ~530 tokens per future task. Pays back at ~440 tasks.
- **C5 council-skip threshold**: prevents this exact spend on future cycles
  where the gain isn't there.

**Verdict: v4 council is net-positive on architecture changes, even though
single-cycle ROI is negative.** Future councils should be triggered only when:
1. The benchmark introduces a new config or new dimension (this run added quality
   verification + S4 + C8), OR
2. Headline cost changed by >15% vs prior cycle (signals investigation worth)

Otherwise, skip council and accept findings.

## Skip threshold proposal for `/benchmark-council` skill

```yaml
council:
  skip_if:
    - cost_change_vs_last < 15%
    - same_configs_as_last == true
    - last_cycle_findings_unimplemented_count > 0
  trigger_if:
    - new_config_added
    - new_dimension_added (quality, temporal, security)
    - cost_change_vs_last > 25%
    - user_explicit_request
```
