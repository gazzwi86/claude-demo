"""PreToolUse:Bash — block hook bypass and unstaged IaC apply."""

import re

from modules.common import block, run_guard


def no_verify_deny(payload: dict) -> None:
    """Block any Bash command that bypasses git hooks or commit signing."""
    cmd = (payload.get("tool_input") or {}).get("command", "")
    if not cmd:
        return
    if re.search(r"--no-verify\b|--no-gpg-sign\b", cmd):
        block(f"no-verify-deny: refusing to bypass git hooks: {cmd[:80]}")
    if re.match(r"\s*git\b", cmd) and re.search(r"\s-n(\b|\s)", cmd) and "commit" in cmd:
        block(f"no-verify-deny: `git commit -n` bypasses hooks: {cmd[:80]}")


def check_iac_plan(payload: dict) -> None:
    """Enforce plan-before-apply for terraform / pulumi via guard script."""
    run_guard("iac-deny.sh", payload)
