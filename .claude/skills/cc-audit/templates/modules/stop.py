"""Stop event handlers — completion-review prompt with re-entry guard.

The Stop event fires every time Claude finishes a turn. Without a guard,
a completion-review prompt that asks Claude to keep working would re-fire
on the *next* stop, producing an infinite loop. Claude Code sets
`stop_hook_active: true` on the payload when the current Stop event was
caused by a previous Stop hook telling Claude to continue — honor that
flag and exit silently.
"""

import sys


REVIEW_PROMPT = (
    "Review the conversation. Did Claude complete the stated task? "
    "If any requested functionality is not implemented, any test is still "
    "failing, or any file mentioned in the task was not actually written, "
    "respond with a short bullet list of what is missing prefixed with "
    "INCOMPLETE:. Otherwise respond with just: task complete."
)


def completion_review(payload: dict) -> None:
    if payload.get("stop_hook_active"):
        return
    sys.stderr.write(f"[{REVIEW_PROMPT}]\n")
    sys.exit(2)
