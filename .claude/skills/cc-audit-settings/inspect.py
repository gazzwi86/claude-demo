#!/usr/bin/env python3
"""cc-audit-settings inspect.py — deterministic detector for settings.json drift."""

import json
import os
import sys
from pathlib import Path

SCHEMA = "v1"
AREA = "settings"

REQUIRED_KEYS = ["plansDirectory", "statusLine", "attribution"]
RECOMMENDED_KEYS = ["strictKnownMarketplaces"]
SELF_MOD_DENIES = [
    "Edit(./.claude/settings.json)",
    "Write(./.claude/settings.json)",
    "Edit(./.claude/scripts/hooks.py)",
    "Write(./.claude/scripts/hooks.py)",
]

MANAGED_DIRS = [
    "/Library/Application Support/ClaudeCode",
    "/etc/claude-code",
]


def load_settings(repo: Path) -> dict:
    p = repo / ".claude" / "settings.json"
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {"__parse_error__": True}


def gitignore_has(repo: Path, line: str) -> bool:
    gi = repo / ".gitignore"
    if not gi.exists():
        return False
    return any(l.strip() == line for l in gi.read_text(encoding="utf-8").splitlines())


def managed_present() -> bool:
    return any(os.path.isdir(d) for d in MANAGED_DIRS)


def finding(fid, severity, title, evidence, remediation, rationale, rollback=""):
    return {
        "id": fid, "severity": severity, "title": title, "evidence": evidence,
        "remediation": remediation, "rationale": rationale, "rollback": rollback,
    }


def inspect(repo: Path) -> dict:
    settings = load_settings(repo)
    findings = []
    skipped = []

    settings_path = ".claude/settings.json"

    if not settings:
        findings.append(finding(
            "settings.missing", "high",
            ".claude/settings.json missing",
            f"{settings_path}: not found",
            {"kind": "scaffold", "patch": "render templates/settings.baseline.json"},
            "No baseline means defaults: no plans dir, no statusLine, no self-mod guards.",
            "Delete .claude/settings.json (no rollback needed; nothing was there)."
        ))
        return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped}

    if "__parse_error__" in settings:
        findings.append(finding(
            "settings.parse-error", "high",
            ".claude/settings.json is not valid JSON",
            f"{settings_path}: json.JSONDecodeError",
            {"kind": "fix", "patch": "fix the JSON syntax"},
            "An unparseable settings file is silently ignored — strict baseline does not apply.",
            "Restore from .claude/backup-<ts>/."
        ))
        return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped}

    is_managed = managed_present()

    for key in REQUIRED_KEYS:
        if key not in settings:
            findings.append(finding(
                f"settings.missing-key.{key}", "medium",
                f"`{key}` not set in settings.json",
                f"{settings_path}: top-level key '{key}' absent",
                {"kind": "settings-patch", "patch": f"add `{key}` from baseline"},
                f"Baseline depends on `{key}` for plan dir / status line / attribution.",
                f"Remove the added `{key}` field."
            ))

    for key in RECOMMENDED_KEYS:
        if key not in settings:
            severity = "medium"
            if is_managed:
                skipped.append({"id": f"settings.missing-key.{key}", "reason": "managed policy may lock this field"})
                continue
            findings.append(finding(
                f"settings.missing-key.{key}", severity,
                f"`{key}` not set",
                f"{settings_path}: top-level key '{key}' absent",
                {"kind": "settings-patch", "patch": f"set `{key}: true`"},
                "Guards against MCP server supply-chain risk.",
                f"Remove `{key}`."
            ))

    deny = (settings.get("permissions") or {}).get("deny") or []
    deny_set = set(deny)
    for guard in SELF_MOD_DENIES:
        if guard not in deny_set:
            findings.append(finding(
                f"settings.deny.missing-{guard.split('(')[1].rstrip(')').replace('.', '-').replace('/', '-')}",
                "high",
                f"Self-modification guard missing: `{guard}`",
                f"{settings_path}: permissions.deny does not contain {guard}",
                {"kind": "settings-patch", "patch": f"append `{guard}` to permissions.deny"},
                "Without this guard, a prompt-injected agent can rewrite the rules that constrain it.",
                f"Remove `{guard}` from permissions.deny."
            ))

    if not gitignore_has(repo, ".claude/settings.local.json"):
        findings.append(finding(
            "settings.local-not-gitignored", "low",
            ".claude/settings.local.json not in .gitignore",
            ".gitignore: missing line",
            {"kind": "gitignore", "patch": "append .claude/settings.local.json"},
            "settings.local.json is meant to be personal/local — gitignore prevents accidental commit.",
            "Remove the appended line."
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
