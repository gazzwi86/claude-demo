"""Session and notification lifecycle hooks."""

import os
import subprocess
import sys

from modules.common import PROJECT_ROOT


def notification(payload: dict) -> None:
    msg = payload.get("message") or os.environ.get("CLAUDE_NOTIFICATION") or ""
    if msg:
        sys.stderr.write(f"Claude says: {msg}\n")


def check_setup_status(_payload: dict) -> None:
    """SessionStart — warn about missing setup (git hooks, graphify)."""
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


def subagent_stop(_payload: dict) -> None:
    """Fires when a subagent stops. Add subagent telemetry here."""


def pre_compact(_payload: dict) -> None:
    """Fires before context compaction. Snapshot state here if needed."""


def session_end(_payload: dict) -> None:
    """Fires at session end. Flush logs, persist state, etc."""
