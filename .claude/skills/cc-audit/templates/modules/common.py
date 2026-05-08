"""Shared helpers for hook modules: payload parsing, blocking, paths, guard runner."""

import json
import os
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
    """Exit 2 with a message Claude will see on stderr."""
    sys.stderr.write(reason.rstrip() + "\n")
    sys.exit(2)


def rel_from_root(p: str) -> str:
    """Resolve `p` relative to PROJECT_ROOT, falling back to absolute."""
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
