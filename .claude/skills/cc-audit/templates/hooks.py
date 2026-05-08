#!/usr/bin/env python3
"""Central dispatcher for every Claude Code hook event in this project.

Settings.json wires every hook to:

    python3 ${CLAUDE_PROJECT_DIR}/.claude/scripts/hooks.py <event> [check]

Each handler receives the parsed-JSON stdin payload. Exit codes:

    0   approve / no-op (default)
    2   block — message on stderr is shown to Claude
    64  usage error

Add new subcommands to PRE_TOOL_USE_CHECKS / POST_TOOL_USE_CHECKS / STOP_CHECKS.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())
GUARDS = PROJECT_ROOT / ".claude" / "scripts" / "guards"


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


def run_guard(script: str, payload: dict) -> None:
    """Pipe payload as JSON to a guard script. exit-2 from guard => block."""
    path = GUARDS / script
    if not path.exists():
        return
    try:
        result = subprocess.run(
            ["bash", str(path)],
            input=json.dumps(payload),
            text=True,
            capture_output=True,
            timeout=10,
        )
    except (subprocess.TimeoutExpired, OSError):
        return
    if result.returncode == 2:
        block(result.stderr.strip() or f"{script}: blocked")


# --- PreToolUse subcommands ----------------------------------------------

def check_secrets(payload: dict) -> None:
    """PreToolUse:Edit|Write — scan content for secrets. Delegates to guard."""
    run_guard("secret-scan.sh", payload)


def no_verify_deny(payload: dict) -> None:
    """PreToolUse:Bash — block --no-verify, --no-gpg-sign, and `git ... -n`."""
    cmd = (payload.get("tool_input") or {}).get("command", "")
    if not cmd:
        return
    if re.search(r"--no-verify\b|--no-gpg-sign\b", cmd):
        block(f"no-verify-deny: refusing to bypass git hooks: {cmd[:80]}")
    if re.match(r"\s*git\b", cmd) and re.search(r"\s-n(\b|\s)", cmd) and "commit" in cmd:
        block(f"no-verify-deny: `git commit -n` bypasses hooks: {cmd[:80]}")


def check_iac_plan(payload: dict) -> None:
    """PreToolUse:Bash — IaC plan-before-apply enforcement via guard."""
    run_guard("iac-deny.sh", payload)


# --- PostToolUse subcommands ---------------------------------------------

def mask_pii_post(payload: dict) -> None:
    """PostToolUse:Edit|Write — mask PII in output. Non-blocking."""
    run_guard("pii-mask.sh", payload)


# --- Stop subcommand -----------------------------------------------------

def stop_pii_mask(payload: dict) -> None:
    """Stop — apply PII regex mask to assistant text. Non-blocking."""
    run_guard("pii-mask.sh", payload)


# --- Other event handlers ------------------------------------------------

def notification(payload: dict) -> None:
    msg = payload.get("message") or os.environ.get("CLAUDE_NOTIFICATION") or ""
    if msg:
        sys.stderr.write(f"Claude says: {msg}\n")


def user_prompt_submit(_payload: dict) -> None:
    """Fires before a user prompt is sent. Add input filters here."""


def stop(_payload: dict) -> None:
    """Default Stop handler when no subcommand. Add transcript hygiene checks here."""


def subagent_stop(_payload: dict) -> None:
    """Fires when a subagent stops."""


def pre_compact(_payload: dict) -> None:
    """Fires before context compaction. Snapshot state here."""


def session_start(_payload: dict) -> None:
    """Fires when a session starts. Check setup status, etc."""


def session_end(_payload: dict) -> None:
    """Fires at session end."""


# --- dispatch ------------------------------------------------------------

PRE_TOOL_USE_CHECKS = {
    "check-secrets": check_secrets,
    "no-verify-deny": no_verify_deny,
    "check-iac-plan": check_iac_plan,
}

POST_TOOL_USE_CHECKS = {
    "mask-pii": mask_pii_post,
}

STOP_CHECKS = {
    "pii-mask": stop_pii_mask,
}

EVENT_HANDLERS = {
    "notification": notification,
    "user-prompt-submit": user_prompt_submit,
    "subagent-stop": subagent_stop,
    "pre-compact": pre_compact,
    "session-start": session_start,
    "session-end": session_end,
}


def main(argv: list) -> None:
    if len(argv) < 2:
        sys.stderr.write(f"usage: {argv[0]} <event> [check]\n")
        sys.exit(64)

    event = argv[1]
    check = argv[2] if len(argv) > 2 else None
    payload = read_payload()

    if event == "pre-tool-use":
        h = PRE_TOOL_USE_CHECKS.get(check or "")
        if h:
            h(payload)
        return

    if event == "post-tool-use":
        h = POST_TOOL_USE_CHECKS.get(check or "")
        if h:
            h(payload)
        return

    if event == "stop":
        h = STOP_CHECKS.get(check or "") or stop
        h(payload)
        return

    h = EVENT_HANDLERS.get(event)
    if not h:
        sys.stderr.write(f"hooks.py: unknown event '{event}'\n")
        sys.exit(64)
    h(payload)


if __name__ == "__main__":
    main(sys.argv)
