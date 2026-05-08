#!/usr/bin/env python3
"""Deterministic repo inspector + fan-out planner for the /cc-audit orchestrator.

Step 1 of the orchestrator's flow. Detects:
- git presence
- monorepo signals
- managed-policy presence
- OSS / lite heuristics
- existing .claude/ contents

Then emits the fan-out plan: which cc-audit-<area> skills to spawn,
which to skip and why.

Usage:
    python3 inspect_repo.py <repo-root>           # human-readable summary
    python3 inspect_repo.py <repo-root> --json    # full inspect result
    python3 inspect_repo.py <repo-root> --trace   # emit fan-out JSONL on stdout

The --trace mode is what the orchestrator's E2E test asserts against. Each
JSONL line conforms to:
    {"phase": "fanout",
     "area": "<area>",
     "skill": "cc-audit-<area>",
     "action": "spawn"|"skip",
     "reason"?: "<text>"}
"""

import json
import os
import subprocess
import sys
from pathlib import Path

ALL_AREAS = [
    "settings", "permissions", "security",
    "claude-md", "skills", "hooks",
    "git-hooks", "enterprise", "monorepo",
]

WORKSPACE_MARKERS = ["pnpm-workspace.yaml", "lerna.json", "nx.json", "turbo.json"]
WORKSPACE_DIRS = ["apps", "packages", "services"]

MANAGED_DIRS = [
    "/Library/Application Support/ClaudeCode",
    "/etc/claude-code",
]


def detect(repo: Path, lite: bool = False) -> dict:
    has_git = (repo / ".git").exists()
    has_license = (repo / "LICENSE").exists()
    has_ci = (repo / ".github" / "workflows").is_dir()

    is_monorepo = False
    monorepo_signals = []
    for m in WORKSPACE_MARKERS:
        if (repo / m).exists():
            is_monorepo = True
            monorepo_signals.append(m)
    for d in WORKSPACE_DIRS:
        wd = repo / d
        if wd.is_dir() and any(p.is_dir() for p in wd.iterdir()):
            is_monorepo = True
            monorepo_signals.append(f"{d}/")

    managed = next((d for d in MANAGED_DIRS if os.path.isdir(d)), None)

    has_remote = False
    if has_git:
        try:
            r = subprocess.run(
                ["git", "-C", str(repo), "remote"],
                capture_output=True, text=True, timeout=2,
            )
            has_remote = bool(r.stdout.strip())
        except (subprocess.TimeoutExpired, OSError):
            pass

    is_oss = has_license and has_remote
    is_lite_candidate = (not has_remote) and (not has_ci) and (not has_license)

    return {
        "repo": str(repo),
        "has_git": has_git,
        "has_license": has_license,
        "has_ci": has_ci,
        "has_remote": has_remote,
        "is_monorepo": is_monorepo,
        "monorepo_signals": monorepo_signals,
        "managed_dir": managed,
        "is_oss": is_oss,
        "is_lite_candidate": is_lite_candidate,
        "lite": lite,
    }


def fanout_plan(detection: dict) -> list:
    """Return list of {area, skill, action, reason?} entries."""
    out = []
    for area in ALL_AREAS:
        skill = f"cc-audit-{area}"
        action = "spawn"
        reason = None

        if area == "git-hooks" and not detection["has_git"]:
            action = "skip"
            reason = "no .git/ — git-hooks audit not applicable"
        elif area == "monorepo" and not detection["is_monorepo"]:
            action = "skip"
            reason = "single-package repo — monorepo audit not applicable"
        elif area == "enterprise" and detection.get("lite"):
            action = "skip"
            reason = "lite profile — enterprise checks omitted"

        entry = {"phase": "fanout", "area": area, "skill": skill, "action": action}
        if reason:
            entry["reason"] = reason
        out.append(entry)
    return out


def main(argv):
    if len(argv) < 2:
        sys.stderr.write(f"usage: {argv[0]} <repo-root> [--json|--trace] [--lite]\n")
        sys.exit(64)

    repo = Path(argv[1]).resolve()
    if not repo.is_dir():
        sys.stderr.write(f"not a directory: {repo}\n")
        sys.exit(64)

    lite = "--lite" in argv
    detection = detect(repo, lite=lite)
    plan = fanout_plan(detection)

    if "--trace" in argv:
        for entry in plan:
            print(json.dumps(entry))
        return

    if "--json" in argv:
        print(json.dumps({"detection": detection, "fanout": plan}, indent=2))
        return

    # Human-readable
    print(f"repo: {repo}")
    for k, v in detection.items():
        if k == "repo":
            continue
        print(f"  {k}: {v}")
    print()
    print("fanout plan:")
    for e in plan:
        marker = "→" if e["action"] == "spawn" else "✗"
        suffix = f"  ({e['reason']})" if e.get("reason") else ""
        print(f"  {marker} {e['skill']}{suffix}")


if __name__ == "__main__":
    main(sys.argv)
