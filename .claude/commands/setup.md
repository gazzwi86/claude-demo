---
description: Wire git hooks, chmod scripts, configure local LLM for the Stop hook, and (optionally) install graphify. Idempotent.
---

You are bootstrapping this repo for Claude Code. Run the steps below in order. Each step is idempotent — re-running `/setup` should be a no-op when already configured.

## Args

- `$ARGUMENTS` may include:
  - `graphify` (or `--graphify`) — also run `bash .claude/scripts/setup-graphify.sh`
  - `llm` (or `--llm`) — only do the LLM configuration step (skip git hooks)
  - `skip-llm` (or `--skip-llm`) — skip the LLM configuration step

## Steps

1. **Wire git hooks via `core.hooksPath`** so `pre-commit` and `pre-push` are versioned with the repo:

   ```bash
   git config core.hooksPath .claude/scripts/git-hooks
   ```

2. **Make Claude-only scripts executable.** Use `find` so the command doesn't error when a glob doesn't match:

   ```bash
   find .claude/scripts -maxdepth 2 -type f \( -name "*.sh" -o -name "*.py" \) -exec chmod +x {} +
   find .claude/scripts/git-hooks -maxdepth 1 -type f -exec chmod +x {} +
   ```

3. **Configure the local LLM for the Stop hook** (skip if `skip-llm` was passed). The Stop hook uses a local model via ollama or LM Studio to detect conversation drift / context exhaustion. Without this step the hook is a silent no-op.

   3a. **Detect a backend.** Run `command -v ollama` and `command -v lms` (LM Studio CLI). Behaviour by what's present:
   - **Both:** ask the user which to use.
   - **One:** use that one.
   - **Neither:** ask: *"No local-LLM backend found. Install one? (1) ollama via Homebrew (`brew install ollama`), (2) LM Studio (point them to <https://lmstudio.ai/>), (3) skip — Stop hook stays a no-op."* Use `AskUserQuestion` if available, otherwise prompt with a 1/2/3 choice. If they pick (1), run `brew install ollama` after explicit confirmation. If (2), tell them to install manually and re-run `/setup llm`. If (3), skip to step 4.

   3b. **List installed models.**
   - For ollama: `ollama list` (parse the table; ignore the header row).
   - For LM Studio: `lms ls` (similar parse).

   3c. **Suggest a model.** Prefer small/fast models suitable for a Stop-hook (runs after every gated turn). Selection priority:
     1. Any `gemma4:e4b` or other `*:e4b` / sub-10GB gemma4
     2. Any `gemma3:4b` or sub-5GB gemma3
     3. Any sub-10GB model with "instruct" or "chat" in the name
     4. Else: smallest installed model
   Tell the user the recommendation and the reason; let them override.

   3d. **Look up the model's context length.** This matters because a small local model can't ingest a 1M-token Opus transcript — the Stop hook caps the excerpt by `LLM_CONTEXT_TOKENS`.
   - For ollama: `ollama show <model>` prints a `context length` line (e.g. `131072`). Parse it.
   - For LM Studio: check the model card in the LM Studio UI, or default to 8192 if unknown.
   - If unparseable, default to `8000` (safe minimum).

   3e. **Persist the choice** to `.claude/settings.local.json` under `env`. Add (or update) these keys:
   - `LLM_BACKEND` — `"ollama"` or `"lmstudio"`
   - `LLM_MODEL` — the chosen model id (e.g. `"gemma4:e4b"`)
   - `LLM_BASE_URL` — `"http://localhost:11434"` for ollama, `"http://localhost:1234/v1"` for LM Studio (only set if non-default)
   - `LLM_CONTEXT_TOKENS` — the model's context length as a string (e.g. `"131072"`)

   Use the `update-config` skill if available; otherwise read the JSON, merge the env keys, write it back. Do NOT delete other env vars or permissions — merge, don't overwrite.

4. **Verify the wiring** — check:
   - `git config core.hooksPath` returns `.claude/scripts/git-hooks`
   - `.claude/scripts/hooks.py` is executable
   - `.claude/settings.local.json` env has `LLM_BACKEND`, `LLM_MODEL`, and `LLM_CONTEXT_TOKENS` (if step 3 ran)

   Report each as `✓` or `✗`.

5. **If the user passed `graphify`**, run `bash .claude/scripts/setup-graphify.sh`. Otherwise mention `/setup graphify` is available as a follow-up.

6. **Confirm completion** with a one-line summary: what was wired, which LLM model is configured (if any), whether graphify ran, and one suggested next action (e.g. `npm test` or `/anatomy`).

## Notes

- This command replaces the old `npm run setup` and `npm run setup:graphify` scripts. Setup itself is Claude-driven, in keeping with the rest of this demo.
- `npm run anatomy:check` is also gone; for an ad-hoc freshness check, run `python3 .claude/scripts/hooks.py check-anatomy-fresh` directly. The pre-push hook calls it for you.
- The Stop hook's behaviour and config are documented in `hooks.py` (`def stop`). It silently no-ops when `LLM_BACKEND` is unset, so skipping step 3 is always safe.
