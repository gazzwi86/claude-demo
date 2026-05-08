"""Lifecycle hook handlers — fire on session/agent/compact transitions.

Every handler is a no-op by default. Add side effects here (notifications,
setup checks, snapshots) without polluting the dispatcher.
"""

import os
import sys


def notification(payload: dict) -> None:
    msg = payload.get("message") or os.environ.get("CLAUDE_NOTIFICATION") or ""
    if msg:
        sys.stderr.write(f"Claude says: {msg}\n")


def user_prompt_submit(_payload: dict) -> None:
    """Fires before each user prompt is sent. Add input filters here."""


def subagent_stop(_payload: dict) -> None:
    """Fires when a subagent stops."""


def pre_compact(_payload: dict) -> None:
    """Fires before context compaction. Snapshot state here."""


def session_start(_payload: dict) -> None:
    """Fires on session start. Verify dependencies, inject context."""


def session_end(_payload: dict) -> None:
    """Fires on session end."""
