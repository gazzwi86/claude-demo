"""Shared utilities imported by all hook modules."""

import json
import os
import re
import sys
from pathlib import Path
from typing import Optional

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())

TRACKED_ROOTS = ("apps", "packages", "infra")


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
        role = (
            event.get("role")
            or (event.get("message") or {}).get("role")
            or event.get("type")
            or "?"
        )
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
