#!/usr/bin/env python3
"""cc-audit-hooks inspect.py — hooks structure + cost detector."""

import json
import re
import sys
from pathlib import Path

SCHEMA = "v1"
AREA = "hooks"

CENTRAL_DISPATCHER_RX = re.compile(r"hooks\.py\s+\S+")
EXPENSIVE_TYPES = {"prompt", "agent", "mcp_tool"}


def load_settings(repo: Path) -> dict:
    p = repo / ".claude" / "settings.json"
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}


def estimate_prompt_tokens(prompt: str) -> int:
    return max(1, len(prompt) // 4)


def finding(fid, severity, title, evidence, remediation, rationale, rollback=""):
    return {
        "id": fid, "severity": severity, "title": title, "evidence": evidence,
        "remediation": remediation, "rationale": rationale, "rollback": rollback,
    }


def inspect(repo: Path) -> dict:
    s = load_settings(repo)
    findings = []
    skipped = []

    if not s:
        return {"area": AREA, "version": SCHEMA, "findings": findings,
                "skipped": [{"id": "hooks.no-settings", "reason": ".claude/settings.json absent"}]}

    hooks = s.get("hooks") or {}
    if not hooks:
        findings.append(finding(
            "hooks.absent", "medium",
            "no hooks configured",
            ".claude/settings.json: hooks block empty",
            {"kind": "scaffold", "patch": "wire baseline hooks via hooks.py dispatcher"},
            "Hooks are the only deterministic enforcement layer; without them, baseline rules are advisory.",
            "Remove the added hooks."
        ))
        return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped}

    has_dispatcher = False
    expensive_count = 0
    expensive_token_estimate = 0

    for event, configs in hooks.items():
        for cfg in configs or []:
            for h in cfg.get("hooks") or []:
                t = h.get("type")
                cmd = h.get("command", "")
                if t == "command" and CENTRAL_DISPATCHER_RX.search(cmd):
                    has_dispatcher = True
                if t in EXPENSIVE_TYPES:
                    expensive_count += 1
                    body = h.get("prompt") or json.dumps(h)
                    expensive_token_estimate += estimate_prompt_tokens(body)
                if "timeout" not in h and t == "command":
                    findings.append(finding(
                        f"hooks.no-timeout.{event}", "low",
                        f"{event} hook missing `timeout`",
                        f".claude/settings.json: hooks.{event} entry has no timeout",
                        {"kind": "settings-patch", "patch": "set timeout in milliseconds (e.g. 5000)"},
                        "Without a timeout, a stuck hook blocks the agent indefinitely.",
                        "Remove the timeout field."
                    ))

    if not has_dispatcher:
        findings.append(finding(
            "hooks.no-central-dispatcher", "medium",
            "hooks do not route through .claude/scripts/hooks.py dispatcher",
            ".claude/settings.json: no hook command matches /hooks\\.py \\S+/",
            {"kind": "migrate", "patch": "centralise hook logic in .claude/scripts/hooks.py; settings.json calls dispatcher"},
            "Central dispatcher prevents stdin contention, gives one audit point, and version-controls hook logic.",
            "n/a"
        ))

    if expensive_count > 0:
        findings.append(finding(
            "hooks.expensive-types", "medium",
            f"{expensive_count} prompt/agent/mcp_tool hook(s) — token cost incurred per fire",
            f".claude/settings.json: {expensive_count} hooks of type prompt/agent/mcp_tool; estimated {expensive_token_estimate} tokens per fire",
            {"kind": "advice", "patch": "convert to type:command + local guard script if logic is regex-shaped"},
            "Prompt/agent hooks fire claude -p-equivalents; high daily-fire-count = high bill.",
            "n/a (advisory)"
        ))

    return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped}


def main(argv):
    if len(argv) < 2:
        sys.stderr.write(f"usage: {argv[0]} <repo-root> [--json]\n")
        sys.exit(64)
    repo = Path(argv[1]).resolve()
    if not repo.is_dir():
        sys.stderr.write(f"not a directory: {repo}\n")
        sys.exit(64)
    out = inspect(repo)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main(sys.argv)
