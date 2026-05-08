# COUNCIL P4 — Senior Dev (DevOps + DX at team scale)

## Most important finding

The benchmark optimizes single-developer single-session token cost while ignoring the operational substrate that makes those numbers reproducible across a team. F1 surfaces `_freshness: stale_index` as a free signal but no SLA, no hook, no CI job exists. Without that, C3/C3b's −34/−44% wins regress silently the moment a teammate pulls without re-indexing.

## Working

- F3 direct-fetch heuristic is robust because per-area CLAUDE.md names symbols (low onboarding cost for the pattern itself).
- F2 honesty about CLAUDE.md auto-injection — that's the kind of accounting that survives a postmortem.
- F6 council ROI tracking exists; rare and good.
- F7 oracle path lint caught real drift.

## Broken

- **Index ownership unclear.** PLAN line 255 gitignores `semble-index.pkl`; jcodemunch's `~/.code-index/` is per-user. No CI rebuild, no shared cache, no version pin. Two devs committing concurrently both ship correct code with divergent local indices — F1 staleness goes undetected until F4-style UI tasks fail mid-edit.
- **No staleness SLA.** F1 names the signal; S5 was supposed to derive the commits-per-reindex threshold (PLAN 130-140) but RESULTS line 105 marks it deferred. Stopping condition unsatisfied.
- **Onboarding latency unmeasured.** A contractor cloning the repo pays: jcodemunch install + index_folder (~16s semble; jcodemunch unknown) + MCP registration. None of this is in C3/C3b totals.
- **F4 + T2 (this file) — C3 goes over C0 when:** (a) target is a self-contained class in a known file, or (b) edit needs surrounding JSX/structural context. The T2 metrics file admits adding the missing PadState fetch would push C3 to 6,380 vs C0's 5,634. No pre-flight predicate tells the agent which regime it's in.

## Proposed changes

1. CI job: `index_folder --incremental` on push to main, publish index artifact; PostToolUse hook warns if local `_freshness == stale_index` and `git rev-parse HEAD` differs from artifact tag.
2. Derive S5 SLA before declaring v4 done — even a coarse "re-index every 10 commits" beats nothing.
3. Pre-flight rule: if task touches one file named in CLAUDE.md and edit is intra-symbol → C0; if multi-file or symbol-graph traversal → C3b. Encode as a 5-line decision in `benchmark-council/SKILL.md`.
4. Add `cc-audit-tools` (PLAN 236) with index-age check, MCP registration, and contractor onboarding script (`pnpm setup:index`).

## Open questions

- Does jcodemunch's index survive `git checkout` across branches, or does branch-switching invalidate it (concurrent-dev case)?
- F6 breakeven at ~4 cycles assumes savings persist; if SLA fix lands, do future cycles still save 13k chars or does the marginal win shrink?
- Is there a token budget for the staleness hook itself before it eats the savings?

## Tokens-spent self-report

Read 3 files (~12k chars input). Output ~520 words ≈ 700 tokens. Total ≈ 4k tokens. No tool calls beyond reads.
