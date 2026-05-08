"""PreToolUse: nudge Claude toward the graphify knowledge graph when present."""

import json
import sys

from modules.common import PROJECT_ROOT


def graphify_hint(_payload: dict) -> None:
    """PreToolUse:Glob|Grep — nudge Claude toward the graphify index when present."""
    if not (PROJECT_ROOT / "graphify-out" / "graph.json").exists():
        return
    sys.stdout.write(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": (
                "graphify: Knowledge graph exists. Read graphify-out/GRAPH_REPORT.md "
                "for god nodes and community structure before searching raw files."
            ),
        }
    }))
