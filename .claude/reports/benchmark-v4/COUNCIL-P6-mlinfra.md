# Council P6 — ML Infra Engineer

Reviewer: ML infra (embeddings / retrieval / indexing tradeoffs)
Inputs: RESULTS.md, PLAN.md, T3/T4/T5-C8-semble.md
Date: 2026-05-08

## Findings

### Crossover scale (F5)

F5 claims "re-evaluate semble at scale". Quantify it. AST indexers like jcodemunch are O(LOC) build, O(log N) lookup, but parser breakage rises with language sprawl. Empirically vector retrieval beats AST-symbol search when (a) symbol naming is non-conventional, (b) >5 languages, or (c) cross-language semantic queries dominate. For TS-mono ~12k LOC, AST wins. Crossover band: ~250k-500k LOC *or* >3 languages with >20% non-TS. The 1M LOC question is wrong framing — language-heterogeneity, not LOC, drives crossover.

### Hybrid (P6's own ask)

Yes — embed *doc-comments + module summaries*, AST-index *symbols*. Doc-strings are dense semantics that AST flattens; symbols are exact-match retrieval AST excels at. Route by query: NL question → embeddings; identifier-shaped token → AST. F4 already shows the two retrievers are complementary (UI tasks need surrounding JSX context, not symbol bodies).

### chunk_size + top_k ablation (F5, T3/T4/T5)

T3 7027ch, T4 5928ch, T5 6592ch — all over 5k cap with top_k=5 × ~1300ch chunks (RESULTS line 60-61). top_k=2 with 2x chunk_size (~2600ch) lands ~5200ch — still over cap and *worse* recall: T3/T5 show the right file at rank 2 with chunk wrong-windowed (schemas.ts:1-42 missed CreateLoopSchema). Real fix is **symbol-aware chunking** (split on AST function/class boundaries, not 200-token windows). Pure top_k tuning is a local optimum.

### Score threshold without labels (F5)

Hybrid scores 0.015-0.025 — near-uniform, no signal. Two label-free options: (1) **score gap** — accept top-k where score[i]-score[i+1] > σ of bottom-half scores; (2) **rank-stability under query perturbation** — re-query with paraphrase, keep chunks intersecting both top-10s. Neither is tunable to a fixed threshold; both work without training data.

### Quality-cost null result (F2, F4, RESULTS line 42)

The strongest finding in v4. All 4 configs produced *identical diffs* (line 36-40). This means exploration is a **bounded search problem** for tasks of this size — once the right files are located, completion is deterministic given a competent agent. Cost differs; quality plateaus. Implication: cease optimising for retrieval recall once oracle_pass=yes; remaining gains are pure token economics, not capability. Council should not fund further retrieval R&D below the crossover scale band.

## Vote

- Approve C3b as default for ≤100k LOC TS-monorepos.
- Approve hybrid (AST symbols + embedded doc-comments) as the next experiment, scoped to a >250k LOC repo.
- Reject further C8 tuning on this repo. F5 is settled: wrong tool for the scale.
