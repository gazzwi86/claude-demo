#!/usr/bin/env python3
"""Hook dispatcher for Claude Code.

Settings.json wires every hook to:

    python3 ${CLAUDE_PROJECT_DIR}/.claude/scripts/hooks.py <event> [check]

`event` is the hook event name; `check` is an optional sub-handler for
events that fan out to multiple checks. Each handler receives the hook
payload (parsed JSON from stdin). Exit codes drive behaviour:

  0  approve / no-op (default)
  2  block — message on stderr is shown to Claude
  64 usage error

Each module in modules/ owns one logical concern. To add a new hook:
  1. Add a function to the relevant module (or create a new one).
  2. Register it in the dispatch table below.
  3. Wire settings.json: python3 .claude/scripts/hooks.py <event> <name>
  4. Add a test under .claude/tests/ if the rule is mechanically checkable.
"""

import sys

from modules import common
from modules import secrets, security, pii, lifecycle, stop

PRE_TOOL_USE_CHECKS = {
    "check-secrets":  [secrets.check_secrets],
    "no-verify-deny": [security.no_verify_deny],
    "check-iac-plan": [security.check_iac_plan],
}

POST_TOOL_USE_CHECKS = {
    "mask-pii": [pii.mask_pii_post],
}

EVENT_HANDLERS = {
    "notification":       [lifecycle.notification],
    "user-prompt-submit": [lifecycle.user_prompt_submit],
    "stop":               [pii.stop_pii_mask, stop.completion_review],
    "subagent-stop":      [lifecycle.subagent_stop],
    "pre-compact":        [lifecycle.pre_compact],
    "session-start":      [lifecycle.session_start],
    "session-end":        [lifecycle.session_end],
}


def _run(handlers: list, payload: dict) -> None:
    for h in handlers:
        h(payload)


def main(argv: list) -> None:
    if len(argv) < 2:
        sys.stderr.write(f"usage: {argv[0]} <event> [check]\n")
        sys.exit(64)

    event = argv[1]
    check = argv[2] if len(argv) > 2 else None
    payload = common.read_payload()

    if event == "pre-tool-use":
        _run(PRE_TOOL_USE_CHECKS.get(check or "", []), payload)
        return

    if event == "post-tool-use":
        _run(POST_TOOL_USE_CHECKS.get(check or "", []), payload)
        return

    handlers = EVENT_HANDLERS.get(event)
    if not handlers:
        sys.stderr.write(f"hooks.py: unknown event '{event}'\n")
        sys.exit(64)
    _run(handlers, payload)


if __name__ == "__main__":
    main(sys.argv)
