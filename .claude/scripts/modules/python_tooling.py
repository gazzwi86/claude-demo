"""PreToolUse: enforce uv over pip for Python tooling. Mirrors .claude/rules/python-tooling.md."""

import re

from modules.common import block

# Forbidden: bare pip install (any form). Allowed: `uv pip install`.
_PIP_PATTERN = re.compile(
    r"(?<!uv\s)(?<!uv\s\s)\b(?:pip3?|python3?\s+-m\s+pip)\s+install\b"
)
_BREAK_SYSTEM = re.compile(r"--break-system-packages\b")

# Strip single/double-quoted strings and heredoc bodies before scanning Bash commands —
# avoids false positives when the literal appears inside a commit message, doc string,
# echo argument, or here-doc payload.
_QUOTED_RE = re.compile(r"'[^']*'|\"[^\"]*\"")
_HEREDOC_RE = re.compile(r"<<-?\s*'?(\w+)'?.*?^\1$", re.DOTALL | re.MULTILINE)

# File paths that may legitimately contain forbidden literals (rule docs, tests, the
# hook's own source). Skip content scanning on these to avoid the chicken-and-egg of
# editing the linter or its rule file.
_EXEMPT_FILE_SUBSTRINGS = (
    "/.claude/scripts/",
    "/tests/",
)
_EXEMPT_MD_DIRS = ("/rules/", "/docs/", "/skills/", "/reports/", "/commands/", "/memory/")


def _strip_quoted(cmd: str) -> str:
    cmd = _HEREDOC_RE.sub("", cmd)
    cmd = _QUOTED_RE.sub("", cmd)
    return cmd


def _msg_pip(location: str) -> str:
    fix = "uv tool install <pkg>, uvx <pkg>, uv add <pkg>, or uv pip install --system <pkg>"
    return (
        f"python-tooling: bare pip install in {location}. Use {fix}. "
        "See .claude/rules/python-tooling.md."
    )


def _msg_break(location: str) -> str:
    return (
        f"python-tooling: --break-system-packages in {location}. "
        "Use uv pip install --system instead. See .claude/rules/python-tooling.md."
    )


def _scan_cmd(cmd: str) -> None:
    bare = _strip_quoted(cmd)
    if _PIP_PATTERN.search(bare):
        block(_msg_pip("Bash command"))
    if _BREAK_SYSTEM.search(bare):
        block(_msg_break("Bash command"))


def _scan_content(text: str, location: str) -> None:
    if not text:
        return
    if _PIP_PATTERN.search(text):
        block(_msg_pip(location))
    if _BREAK_SYSTEM.search(text):
        block(_msg_break(location))


def _is_exempt_path(file_path: str) -> bool:
    if any(s in file_path for s in _EXEMPT_FILE_SUBSTRINGS):
        return True
    if file_path.endswith(".md") and any(s in file_path for s in _EXEMPT_MD_DIRS):
        return True
    return False


def check_uv_over_pip(payload: dict) -> None:
    """PreToolUse:Edit|Write|Bash — block any use of bare pip install."""
    tool_name = payload.get("tool_name") or ""
    tool_input = payload.get("tool_input") or {}

    if tool_name == "Bash":
        _scan_cmd(tool_input.get("command") or "")
        return

    if tool_name in ("Edit", "Write"):
        file_path = tool_input.get("file_path") or ""
        if _is_exempt_path(file_path):
            return
        content = (
            tool_input.get("content")
            or tool_input.get("new_string")
            or ""
        )
        _scan_content(content, file_path or "edited content")
