"""PostToolUse: run eslint-plugin-security on apps/web TypeScript files."""

import re
import subprocess
from shutil import which

from modules.common import PROJECT_ROOT, rel_from_root, block


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
