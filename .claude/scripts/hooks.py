#!/usr/bin/env python3
"""Single dispatcher for every Claude Code hook event in this project.

Settings.json wires every hook to:

    python3 ${CLAUDE_PROJECT_DIR}/.claude/scripts/hooks.py <event> [check]

`event` is the hook event name (pre-tool-use, post-tool-use, notification,
user-prompt-submit, stop, subagent-stop, pre-compact, session-start,
session-end). `check` is an optional sub-handler for events that fan out
to multiple checks (PostToolUse currently runs three).

Each handler receives the hook payload (parsed JSON from stdin). Exit
codes drive behaviour:

  0  approve / no-op (default)
  2  block — message on stderr is shown to Claude

Place new project hooks here rather than in fresh files; this keeps the
hook surface auditable and language-consistent.
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from shutil import which
from typing import Optional

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())


# --- generic helpers ------------------------------------------------------

def read_payload() -> dict:
    raw = sys.stdin.read() if not sys.stdin.isatty() else ""
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def block(reason: str) -> None:
    sys.stderr.write(reason.rstrip() + "\n")
    sys.exit(2)


def rel_from_root(p: str) -> str:
    abs_ = Path(p) if os.path.isabs(p) else (PROJECT_ROOT / p).resolve()
    try:
        return str(abs_.relative_to(PROJECT_ROOT)).replace("\\", "/")
    except ValueError:
        return str(abs_)


# --- anatomy map (path → wiki page) ---------------------------------------

TRACKED_ROOTS = ("apps", "packages", "infra")


def is_tracked(rel_path: str) -> bool:
    norm = re.sub(r"^[./\\]+", "", rel_path)
    return any(norm == r or norm.startswith(r + "/") for r in TRACKED_ROOTS)


def area_for_path(rel_path: str) -> Optional[str]:
    """Map a repo-relative file path to a wiki area name.

    Layout assumption (post-rewrite monorepo):
      apps/web/{app,components,lib,hooks,e2e,tests}/...   -> "web-<top>"
      apps/web/lib/audio/...                              -> "web-audio"
      apps/web/components/<group>/...                     -> "web-<group>"
      apps/api/src/{routes,services,db,middleware}/...    -> "api-<sub>"
      apps/api/tests/...                                  -> "api-tests"
      packages/<name>/...                                 -> "<name>"  (e.g. "shared")
      infra/<sub>/...                                     -> "infra-<sub>"
    """
    norm = re.sub(r"^[./\\]+", "", rel_path)
    parts = norm.split("/")
    if not parts or not parts[0]:
        return None

    head = parts[0]

    if head == "packages" and len(parts) >= 2:
        return parts[1]

    if head == "infra":
        return "infra-" + (parts[1] if len(parts) > 1 else "root")

    if head == "apps" and len(parts) >= 4:
        # Only files inside a subdirectory get a wiki area; top-level
        # config files (apps/web/tsconfig.json, etc.) are intentionally
        # untracked.
        app = parts[1]
        top = parts[2]
        if app == "web":
            if top == "lib" and len(parts) > 4 and parts[3] == "audio":
                return "web-audio"
            if top == "components" and len(parts) > 4:
                return f"web-{parts[3]}"
            if top == "app":
                return "web-pages"
            return f"web-{top}"
        if app == "api":
            if top == "src" and len(parts) > 4:
                return f"api-{parts[3]}"
            if top == "tests":
                return "api-tests"
            return f"api-{top}"
        return f"{app}-{top}"

    return None


def wiki_page_for_path(rel_path: str) -> Optional[str]:
    if not is_tracked(rel_path):
        return None
    area = area_for_path(rel_path)
    return f"docs/wiki/{area}.md" if area else None


# --- PreToolUse handlers --------------------------------------------------

SECRET_PATTERNS = [
    re.compile(r"""(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}["']""", re.IGNORECASE),
    re.compile(r"sk-[a-zA-Z0-9]{20,}"),
    re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
    # Dynamic code execution — dangerous in API/shared where no eslint safety net
    re.compile(r"\beval\s*\("),
    re.compile(r"\bnew\s+Function\s*\("),
]

_TEST_FILE_RE = re.compile(r"\.(?:test|spec)\.(?:ts|tsx|js|mjs)$")


def check_no_secrets(payload: dict) -> None:
    """PreToolUse:Edit|Write — block writes that contain hardcoded secrets or dangerous patterns.

    Skips *.test.ts / *.spec.ts files — test fixtures legitimately use dummy secrets and
    eval is sometimes used in sandboxed assertion helpers.
    """
    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path") or ""

    if not re.search(r"(?:^|/)(?:apps|packages|infra|\.claude/scripts)/", file_path):
        return

    if _TEST_FILE_RE.search(file_path):
        return

    content = tool_input.get("content") or tool_input.get("new_string") or ""
    if not content:
        return

    for pattern in SECRET_PATTERNS:
        m = pattern.search(content)
        if m:
            preview = m.group(0)[:40] + "..."
            block(f"check-no-secrets: potential secret in {file_path} -> {preview}")


def graphify_hint(_payload: dict) -> None:
    """PreToolUse:Glob|Grep — nudge Claude toward the graphify index when present."""
    if not (PROJECT_ROOT / "graphify-out" / "graph.json").exists():
        return
    sys.stdout.write(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": (
                "graphify: Knowledge graph exists. Read graphify-out/GRAPH_REPORT.md "
                "for god nodes and community structure before searching raw files."
            ),
        }
    }))


# --- PostToolUse handlers -------------------------------------------------

_REQUIRE_RE = re.compile(r"""\brequire\s*\(\s*["']([^"']+)["']\s*\)""")
_BLOCK_COMMENT = re.compile(r"/\*[\s\S]*?\*/")
_LINE_COMMENT = re.compile(r"(^|[^:])//.*$", re.MULTILINE)


def _resolve_local(from_file: Path, spec: str) -> Optional[Path]:
    if not (spec.startswith(".") or spec.startswith("/")):
        return None
    base = Path(spec) if spec.startswith("/") else (from_file.parent / spec).resolve()
    for candidate in (base, base.with_suffix(".js"), base / "index.js"):
        if candidate.is_file():
            return candidate.resolve()
    return None


def _extract_requires(file: Path) -> list[str]:
    src = file.read_text(encoding="utf-8")
    stripped = _LINE_COMMENT.sub(r"\1", _BLOCK_COMMENT.sub("", src))
    return _REQUIRE_RE.findall(stripped)


def _find_cycle(start: Path) -> Optional[list[Path]]:
    stack: list[Path] = []
    on_stack: set[Path] = set()
    visited: set[Path] = set()

    def dfs(node: Path) -> Optional[list[Path]]:
        if node in on_stack:
            idx = stack.index(node)
            return stack[idx:] + [node]
        if node in visited:
            return None
        visited.add(node)
        on_stack.add(node)
        stack.append(node)

        try:
            deps = _extract_requires(node)
        except OSError:
            deps = []

        for spec in deps:
            resolved = _resolve_local(node, spec)
            if not resolved:
                continue
            cycle = dfs(resolved)
            if cycle:
                return cycle

        stack.pop()
        on_stack.discard(node)
        return None

    return dfs(start)


def check_circular_deps(_payload: dict) -> None:
    """PostToolUse:Edit|Write — disabled.

    The original DFS walked CommonJS `require()` edges in `src/*.js`. The
    rewrite uses TypeScript + ESM across `apps/`, `packages/` — `_extract_requires`
    no longer applies. Re-enable by shelling to `madge --circular --extensions ts,tsx`
    if a cycle gate is wanted again.
    """
    return


def mark_anatomy_stale(payload: dict) -> None:
    """PostToolUse:Edit|Write — append a stale marker to the area's wiki page."""
    file_path = (payload.get("tool_input") or {}).get("file_path")
    if not file_path:
        return

    rel = rel_from_root(file_path)
    if not is_tracked(rel):
        return

    wiki_rel = wiki_page_for_path(rel)
    if not wiki_rel:
        return

    wiki_abs = PROJECT_ROOT / wiki_rel
    marker = f"<!-- stale: {rel} -->"

    try:
        body = wiki_abs.read_text(encoding="utf-8")
    except OSError:
        body = f"# {wiki_abs.stem}\n\n_(empty — run /anatomy)_\n"

    if marker in body:
        return

    stamp = datetime.now(timezone.utc).isoformat()
    wiki_abs.parent.mkdir(parents=True, exist_ok=True)
    wiki_abs.write_text(body + f"\n{marker} <!-- at: {stamp} -->\n", encoding="utf-8")


def claude_review(payload: dict) -> None:
    """PostToolUse:Edit|Write — shell out to `claude -p` for an LLM review.

    DISABLED in settings.json (per-edit LLM calls are too expensive for always-on).
    Kept here so .claude/examples/expensive-hooks.json can reference it.
    To re-enable: add to PostToolUse hooks in settings.local.json.
    See also: the `prompt:` hook variant in examples/expensive-hooks.json.
    """
    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path") or ""
    if not re.search(r"(?:^|/)(?:apps|packages)/.+\.(?:ts|tsx|js)$", file_path):
        return

    content = tool_input.get("content") or tool_input.get("new_string") or ""
    if not content.strip():
        return

    if not which("claude"):
        return  # offline / CI without the CLI — no-op.

    prompt = (
        "You are a security linter. Inspect the file content below and respond with "
        'JSON ONLY: {"block":true,"reason":"..."} on a violation '
        '(hardcoded secrets, eval/Function, SQL injection, command injection), or '
        '{"block":false} otherwise.\n\n'
        f"File: {file_path}\n---\n{content[:8000]}\n"
    )
    try:
        result = subprocess.run(
            ["claude", "-p", prompt, "--output-format", "text"],
            capture_output=True, text=True, timeout=30,
        )
    except (subprocess.TimeoutExpired, OSError):
        return

    try:
        verdict = json.loads(result.stdout.strip())
    except (json.JSONDecodeError, AttributeError):
        return

    if verdict.get("block"):
        block(f"claude-review: {verdict.get('reason', 'flagged by /security-review')}")


def check_eslint_security(payload: dict) -> None:
    """PostToolUse:Edit|Write — run eslint-plugin-security on apps/web .ts/.tsx files.

    Deterministic (no LLM call). Skips test files (excluded in eslint.security.config.js).
    Requires apps/web/eslint.security.config.js and pnpm to be available.
    """
    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path") or ""

    rel = rel_from_root(file_path)
    if not re.match(r"apps/web/.+\.(?:ts|tsx)$", rel):
        return

    config = PROJECT_ROOT / "apps" / "web" / "eslint.security.config.js"
    if not config.exists():
        return

    if not which("pnpm"):
        return

    abs_file = (PROJECT_ROOT / rel).resolve()
    if not abs_file.exists():
        return

    try:
        result = subprocess.run(
            ["pnpm", "--filter", "@looper/web", "exec",
             "eslint", "--config", "eslint.security.config.js", str(abs_file)],
            capture_output=True, text=True, timeout=18,
            cwd=str(PROJECT_ROOT),
        )
    except (subprocess.TimeoutExpired, OSError):
        return

    if result.returncode != 0:
        out = (result.stdout + result.stderr).strip()[:400]
        if out:
            block(f"check-eslint-security: {out}")


# --- Stop handler + helpers -----------------------------------------------

def _project_memory_flush_nudge(transcript_path: str) -> None:
    """Nudge the user when save-trigger keywords appeared this turn but no
    memory file was written. Deterministic, no LLM call.
    """
    memory_dir = PROJECT_ROOT / ".claude" / "memory"
    if not memory_dir.exists():
        return

    excerpt = _last_messages_excerpt(transcript_path, max_messages=10, max_chars=4000)
    if not excerpt or not _PROJECT_MEMORY_TRIGGERS.search(excerpt):
        return

    try:
        transcript_mtime = Path(transcript_path).stat().st_mtime
    except OSError:
        return

    window_start = transcript_mtime - 900  # 15 minutes — covers a typical turn
    for entry in memory_dir.iterdir():
        if entry.is_file() and entry.suffix == ".md":
            try:
                if entry.stat().st_mtime >= window_start:
                    return
            except OSError:
                continue

    sys.stderr.write(
        "project-memory: save-trigger keywords detected this turn but no memory "
        "writes. Run /remember to save explicitly, or ignore if not applicable.\n"
    )


def stop(payload: dict) -> None:
    """Fires when the main agent stops.

    Runs two independent advisory checks:
      a. Project-memory flush nudge — deterministic, fast, no LLM.
      b. Drift detection (below) — token threshold + optional local LLM.

    Two-stage check — token threshold + LLM-gated drift detection:
      1. Cheap: estimate the transcript's token usage. Below STOP_HOOK_DRIFT_GATE
         (default 30% of context) we return immediately, no local-LLM call.
      2. Gated: above the threshold, ask the configured local LLM
         (ollama or lm studio) to decide between "nothing", "compact",
         or "clear". Print its verdict to stderr; do not block.

    Configuration is read from env (set by `/setup` into settings.local.json):
      LLM_BACKEND           — "ollama" | "lmstudio" (omit to disable hook)
      LLM_MODEL             — model identifier (e.g. "gemma4:e4b")
      LLM_BASE_URL          — backend HTTP base (defaults per backend)
      LLM_CONTEXT_TOKENS    — *local* model's context window (default 8000).
                              Used to size the excerpt sent to it; a small
                              local model can't ingest a 1M-token Opus
                              transcript, so we send a bounded tail.
      CLAUDE_CONTEXT_TOKENS — *Claude's* context-window size (default 200000),
                              used purely to compute the usage% threshold.
      STOP_HOOK_DRIFT_GATE  — pct (0-100) below which we skip the LLM (default 30)

    All failures (no backend, bad transcript, network error, parse fail) are
    silent no-ops — this hook must never block or annoy.
    """
    transcript_path = payload.get("transcript_path")
    if transcript_path:
        _project_memory_flush_nudge(transcript_path)

    backend = os.environ.get("LLM_BACKEND", "").strip().lower()
    if backend not in {"ollama", "lmstudio"}:
        return

    if not transcript_path:
        return

    context_max = int(os.environ.get("CLAUDE_CONTEXT_TOKENS", "200000"))
    drift_gate = float(os.environ.get("STOP_HOOK_DRIFT_GATE", "30"))
    if context_max <= 0:
        return

    tokens = _estimate_transcript_tokens(transcript_path)
    if tokens is None:
        return

    usage_pct = (tokens / context_max) * 100
    if usage_pct < drift_gate:
        return

    # Excerpt budget: roughly half the local model's context (in chars), to
    # leave room for the prompt template (~500 tokens) and the response.
    llm_ctx = max(2000, int(os.environ.get("LLM_CONTEXT_TOKENS", "8000")))
    excerpt_chars = max(2000, (llm_ctx - 500) * 4 // 2)

    excerpt = _last_messages_excerpt(transcript_path, max_messages=24, max_chars=excerpt_chars)
    if not excerpt:
        return

    response = _ask_local_llm(backend, _build_drift_prompt(excerpt, usage_pct))
    if response is None:
        return

    verdict = _parse_drift_verdict(response)
    if not verdict or verdict["action"] == "nothing":
        return

    cmd = "/compact" if verdict["action"] == "compact" else "/clear"
    sys.stderr.write(
        f"✨ conversation hygiene: consider {cmd} "
        f"({usage_pct:.0f}% context used) — {verdict['reason']}\n"
    )


def _estimate_transcript_tokens(path: str) -> Optional[int]:
    """Approx token count from a JSONL transcript: chars/4 over message text."""
    try:
        text = Path(path).read_text(encoding="utf-8")
    except OSError:
        return None

    chars = 0
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        chars += _sum_text_chars(event)

    return chars // 4 if chars else 0


def _sum_text_chars(obj: object) -> int:
    if isinstance(obj, str):
        return len(obj)
    if isinstance(obj, dict):
        return sum(_sum_text_chars(v) for v in obj.values())
    if isinstance(obj, list):
        return sum(_sum_text_chars(v) for v in obj)
    return 0


def _last_messages_excerpt(path: str, max_messages: int, max_chars: int) -> str:
    try:
        lines = Path(path).read_text(encoding="utf-8").splitlines()
    except OSError:
        return ""

    excerpts: list[str] = []
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        role = event.get("role") or (event.get("message") or {}).get("role") or event.get("type") or "?"
        body = event.get("message") or event.get("content") or ""
        if not _sum_text_chars(body):
            continue
        snippet = json.dumps(event)[:600]
        excerpts.append(f"[{role}] {snippet}")
        if len(excerpts) >= max_messages:
            break

    excerpts.reverse()
    joined = "\n".join(excerpts)
    return joined[-max_chars:]


def _build_drift_prompt(excerpt: str, usage_pct: float) -> str:
    return (
        "You advise on conversation hygiene for a Claude Code coding session. "
        "Given the recent transcript excerpt and current token-usage percentage, "
        "decide ONE of:\n"
        '  - "nothing": continue as-is.\n'
        '  - "compact": context is filling up but the topic is consistent — compress earlier turns.\n'
        '  - "clear": the user has clearly moved to a new task/subject — start fresh.\n\n'
        "Respond with JSON ONLY, no prose:\n"
        '  {"action":"nothing"|"compact"|"clear","reason":"<one short sentence>"}\n\n'
        f"Token usage: {usage_pct:.0f}% of context window.\n\n"
        "Recent transcript:\n"
        f"{excerpt}\n\n"
        "JSON:"
    )


def _parse_drift_verdict(text: str) -> Optional[dict]:
    """Extract the first JSON object with an 'action' field from raw model output."""
    if not text:
        return None
    match = re.search(r"\{[^{}]*\"action\"[^{}]*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        verdict = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    action = verdict.get("action")
    if action not in {"nothing", "compact", "clear"}:
        return None
    return {"action": action, "reason": str(verdict.get("reason", "")).strip()}


def _ask_local_llm(backend: str, prompt: str) -> Optional[str]:
    """POST to a local LLM (ollama or lm studio). Returns response text or None."""
    import urllib.error
    import urllib.request

    model = os.environ.get("LLM_MODEL", "").strip()
    if not model:
        return None

    base = os.environ.get("LLM_BASE_URL", "").rstrip("/")

    if backend == "ollama":
        if not base:
            base = "http://localhost:11434"
        url = f"{base}/api/generate"
        body = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode("utf-8")
        text_field = "response"
    elif backend == "lmstudio":
        if not base:
            base = "http://localhost:1234/v1"
        url = f"{base}/chat/completions"
        body = json.dumps({
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
        }).encode("utf-8")
        text_field = None  # extracted via choices[0].message.content below
    else:
        return None

    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, json.JSONDecodeError, TimeoutError):
        return None

    if text_field:
        return data.get(text_field)
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return None


# --- other event handlers -------------------------------------------------
# Each is wired in settings.json so the dispatcher sees every event Claude
# Code emits. Replace the bodies as needs arise.

def notification(payload: dict) -> None:
    msg = payload.get("message") or os.environ.get("CLAUDE_NOTIFICATION") or ""
    if msg:
        sys.stderr.write(f"Claude says: {msg}\n")


_MEMORY_INDEX = PROJECT_ROOT / ".claude" / "memory" / "MEMORY.md"

_PROJECT_MEMORY_TRIGGERS = re.compile(
    r"\b("
    r"remember|from now on|always|never|"
    r"we (?:decided|agreed|use|prefer|don't|do not|always|never)|"
    r"the team (?:decided|agreed|prefers|uses|wants)|"
    r"in this (?:repo|project|codebase)|"
    r"for this (?:project|codebase|repo)|"
    r"our (?:convention|standard|rule|decision)"
    r")\b",
    re.IGNORECASE,
)


def _read_memory_index() -> Optional[str]:
    """Return MEMORY.md contents, capped at 200 lines (the documented soft limit)."""
    try:
        text = _MEMORY_INDEX.read_text(encoding="utf-8")
    except OSError:
        return None
    lines = text.splitlines()
    if len(lines) > 200:
        lines = lines[:200] + ["", "<!-- truncated at 200 lines -->"]
    return "\n".join(lines).strip()


def user_prompt_submit(payload: dict) -> None:
    """Nudge the project-memory skill when the prompt looks like a save trigger.

    No automatic writes — the agent decides via the skill body. We only inject
    a hint so the skill description is more likely to surface.
    """
    prompt = (payload.get("prompt") or payload.get("user_prompt") or "").strip()
    if not prompt or not _PROJECT_MEMORY_TRIGGERS.search(prompt):
        return

    sys.stdout.write(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": (
                "project-memory hint: the prompt contains a save-trigger keyword. "
                "Consider invoking the `project-memory` skill to classify and route "
                "this fact to .claude/memory/ (project) or user memory (personal). "
                "Skip if the fact is already covered by CLAUDE.md, rules/, ANATOMY.md, "
                "or git history."
            ),
        }
    }))


def subagent_stop(_payload: dict) -> None:
    """Fires when a subagent stops. Add subagent telemetry here."""


def pre_compact(_payload: dict) -> None:
    """Fires before context compaction. Snapshot state here if needed."""


def session_start(_payload: dict) -> None:
    """Inject project-memory index into context and surface setup gaps."""
    memory = _read_memory_index()
    if memory:
        sys.stdout.write(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "SessionStart",
                "additionalContext": (
                    "Project memory (committed at .claude/memory/MEMORY.md) — facts "
                    "the agent has learned about this repo, team, and ongoing work. "
                    "Writes are governed by the `project-memory` skill; personal "
                    "preferences continue to go to user-level memory.\n\n"
                    f"{memory}"
                ),
            }
        }) + "\n")

    missing = []

    try:
        result = subprocess.run(
            ["git", "config", "core.hooksPath"],
            cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=2,
        )
        if result.stdout.strip() != ".claude/scripts/git-hooks":
            missing.append("git hooks not wired (run /setup)")
    except (subprocess.TimeoutExpired, OSError):
        pass

    if not (PROJECT_ROOT / "graphify-out" / "graph.json").exists():
        missing.append("graphify not indexed (run /setup graphify — optional)")

    if missing:
        sys.stderr.write("setup status:\n  - " + "\n  - ".join(missing) + "\n")


def session_end(_payload: dict) -> None:
    """Fires at session end. Flush logs, persist state, etc."""


# --- standalone CLI subcommand --------------------------------------------

def check_anatomy_fresh(_payload: dict) -> None:
    """Wiki freshness gate. Used by the pre-push git hook.

    Run ad-hoc with: python3 .claude/scripts/hooks.py check-anatomy-fresh
    """
    wiki_dir = PROJECT_ROOT / "docs" / "wiki"
    if not wiki_dir.exists():
        return

    stale: list[tuple[str, str]] = []
    for f in sorted(wiki_dir.iterdir()):
        if f.suffix != ".md":
            continue
        for m in re.finditer(r"<!-- stale: (\S+) -->", f.read_text(encoding="utf-8")):
            stale.append((f.name, m.group(1)))

    if not stale:
        return

    files = " ".join(s[1] for s in stale)
    lines = "\n".join(f"  {wiki}: {file}" for wiki, file in stale)
    sys.stderr.write(
        f"check-anatomy-fresh: {len(stale)} stale wiki entries\n{lines}\n\n"
        f'run: claude -p "/anatomy refresh {files}"\n'
    )
    sys.exit(1)


# --- dispatch -------------------------------------------------------------

PRE_TOOL_USE_CHECKS = {
    "check-no-secrets": check_no_secrets,
    "graphify-hint": graphify_hint,
}

POST_TOOL_USE_CHECKS = {
    "check-circular-deps": check_circular_deps,
    "mark-anatomy-stale": mark_anatomy_stale,
    "claude-review": claude_review,
    "check-eslint-security": check_eslint_security,
}

EVENT_HANDLERS = {
    "notification": notification,
    "user-prompt-submit": user_prompt_submit,
    "stop": stop,
    "subagent-stop": subagent_stop,
    "pre-compact": pre_compact,
    "session-start": session_start,
    "session-end": session_end,
    "check-anatomy-fresh": check_anatomy_fresh,
}


def main(argv: list[str]) -> None:
    if len(argv) < 2:
        sys.stderr.write(f"usage: {argv[0]} <event> [check]\n")
        sys.exit(64)

    event = argv[1]
    check = argv[2] if len(argv) > 2 else None
    payload = read_payload()

    if event == "pre-tool-use":
        handler = PRE_TOOL_USE_CHECKS.get(check or "")
        if handler:
            handler(payload)
        return

    if event == "post-tool-use":
        handler = POST_TOOL_USE_CHECKS.get(check or "")
        if handler:
            handler(payload)
        return

    handler = EVENT_HANDLERS.get(event)
    if not handler:
        sys.stderr.write(f"hooks.py: unknown event '{event}'\n")
        sys.exit(64)
    handler(payload)


if __name__ == "__main__":
    main(sys.argv)
