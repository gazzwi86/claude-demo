#!/usr/bin/env python3
"""cc-audit-enterprise inspect.py — managed policy + MCP + login config detector."""

import json
import os
import sys
from pathlib import Path

SCHEMA = "v1"
AREA = "enterprise"

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
        return {}


def finding(fid, severity, title, evidence, remediation, rationale, rollback=""):
    return {
        "id": fid, "severity": severity, "title": title, "evidence": evidence,
        "remediation": remediation, "rationale": rationale, "rollback": rollback,
    }


def inspect(repo: Path, lite: bool = False) -> dict:
    findings = []
    skipped = []

    if lite:
        skipped.append({"id": "enterprise.lite", "reason": "lite profile; enterprise checks omitted"})
        return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped}

    s = load_settings(repo)

    # forceLoginMethod must be string, not array
    flm = s.get("forceLoginMethod")
    if flm is not None:
        if isinstance(flm, list):
            findings.append(finding(
                "enterprise.forceLoginMethod.array", "high",
                "forceLoginMethod is an array; must be a string",
                f".claude/settings.json: forceLoginMethod = {flm!r}",
                {"kind": "settings-patch", "patch": "set forceLoginMethod to a single string: \"claudeai\" or \"console\""},
                "Array form fails silently — login is not forced.",
                "n/a"
            ))
        elif flm not in ("claudeai", "console"):
            findings.append(finding(
                "enterprise.forceLoginMethod.invalid", "medium",
                f"forceLoginMethod has unexpected value: {flm!r}",
                f".claude/settings.json: forceLoginMethod = {flm!r}",
                {"kind": "settings-patch", "patch": "set to \"claudeai\" or \"console\""},
                "Other values are not supported.",
                ""
            ))

    # forceLoginOrgUUID must be single UUID
    flo = s.get("forceLoginOrgUUID")
    if isinstance(flo, list):
        findings.append(finding(
            "enterprise.forceLoginOrgUUID.array", "high",
            "forceLoginOrgUUID is an array; must be a single UUID string",
            f".claude/settings.json: forceLoginOrgUUID = {flo!r}",
            {"kind": "settings-patch", "patch": "set forceLoginOrgUUID to a single UUID string"},
            "Array form is not supported.",
            ""
        ))

    # MCP allowlist hygiene
    if "strictKnownMarketplaces" not in s:
        findings.append(finding(
            "enterprise.strictKnownMarketplaces.absent", "medium",
            "strictKnownMarketplaces not set",
            ".claude/settings.json: top-level key absent",
            {"kind": "settings-patch", "patch": "set strictKnownMarketplaces: true"},
            "Without this, a new MCP server added to a non-curated marketplace is supply-chain risk.",
            ""
        ))

    # Managed dir
    managed = next((d for d in MANAGED_DIRS if os.path.isdir(d)), None)
    if managed:
        skipped.append({"id": "enterprise.managed-detected", "reason": f"managed policy at {managed}; defer to managed values"})

    return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped}


def main(argv):
    if len(argv) < 2:
        sys.stderr.write(f"usage: {argv[0]} <repo-root> [--json] [--lite]\n")
        sys.exit(64)
    repo = Path(argv[1]).resolve()
    lite = "--lite" in argv
    if not repo.is_dir():
        sys.stderr.write(f"not a directory: {repo}\n")
        sys.exit(64)
    out = inspect(repo, lite=lite)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main(sys.argv)
