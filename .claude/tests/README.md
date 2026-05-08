# `.claude/tests/` — tests for the harness

Yes, the Claude Code config has its own test suite. The hook dispatcher
is enough Python that getting it wrong silently breaks every workflow,
so it's worth proving correct.

## Files

- `hooks_test.py` — 35 specs. Run via `python3 .claude/tests/hooks_test.py`
  or `.claude/tests/run.sh`.
- `run.sh` — convenience wrapper for the suite.

## What's covered

| Test class | What it locks down |
|---|---|
| `TokenEstimateTests` | The transcript-token estimator used by the Stop drift hook. Empty file = 0; bad JSON lines skipped; chars/4 within bounds. |
| `LastMessagesExcerptTests` | Recent-N-message tail extractor. Returns the most recent N; respects the max-chars cap. |
| `BuildDriftPromptTests` | Drift-detection prompt template includes the action choices + token-usage % + excerpt. |
| `ParseDriftVerdictTests` | Robust parsing of the LLM's verdict — accepts `{"action":"compact","reason":"..."}` from prose, rejects garbage, rejects unknown actions. |
| `StopHookFlowTests` | End-to-end Stop hook with the LLM call mocked. Covers: silent-when-unconfigured, silent-below-gate, prints `/compact` and `/clear` to stderr, silent on bad LLM responses, **bounds the prompt size by the local model's context**. |
| `AreaForPathTests` | The path → wiki-area mapping that drives `mark-anatomy-stale`. Locks the `apps/web/lib/audio → web-audio` style mapping; locks that `len(parts) >= 4` is required so top-level config files don't produce wiki pages. |
| `IsTrackedTests` | Roots gate (`apps`, `packages`, `infra` only). Legacy `src/old.js` no longer tracked. |

## What's *not* covered yet

The current suite tests the dispatcher; it doesn't end-to-end test the
hook events the way Claude Code itself fires them. A future addition:

- Run `python3 hooks.py post-tool-use mark-anatomy-stale` with a stub
  payload and assert the wiki file got the stale marker appended.
- Run `python3 hooks.py pre-tool-use check-no-secrets` against a payload
  that does + doesn't contain a fake secret, assert exit codes (0 vs 2).

That'd give us a "the harness is wired correctly" gate independent of the
unit tests.

## When to add a test

Anytime you add a function to `../scripts/hooks.py`, especially if it's
exit-code-driven (block / approve). The dispatcher fires on every tool
call; a wrong exit code there is a wrong exit code on *every* edit.
