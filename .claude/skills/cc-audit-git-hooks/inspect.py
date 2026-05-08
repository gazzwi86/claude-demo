#!/usr/bin/env python3
"""cc-audit-git-hooks inspect.py — git hooks detector. Skips when .git/ absent."""

import json
import subprocess
import sys
from pathlib import Path

SCHEMA = "v1"
AREA = "git-hooks"


def get_hooks_path(repo: Path) -> str:
    try:
        r = subprocess.run(
            ["git", "-C", str(repo), "config", "core.hooksPath"],
            capture_output=True, text=True, timeout=2,
        )
        return r.stdout.strip()
    except (subprocess.TimeoutExpired, OSError):
        return ""


def finding(fid, severity, title, evidence, remediation, rationale, rollback=""):
    return {
        "id": fid, "severity": severity, "title": title, "evidence": evidence,
        "remediation": remediation, "rationale": rationale, "rollback": rollback,
    }


def inspect(repo: Path) -> dict:
    findings = []
    skipped = []

    if not (repo / ".git").exists():
        skipped.append({"id": "git-hooks.no-git",
                        "reason": "git not detected, skipping; rerun after `git init`"})
        return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped}

    hp = get_hooks_path(repo)
    desired = ".claude/scripts/git-hooks"

    if hp == desired:
        # OK; check hook scripts
        for h in ("pre-commit", "pre-push"):
            target = repo / desired / h
            if not target.exists():
                findings.append(finding(
                    f"git-hooks.missing.{h}", "medium",
                    f"hook script missing: {h}",
                    f"{desired}/{h}: not found",
                    {"kind": "scaffold", "patch": f"render templates/git-hooks/{h}"},
                    "Without the script, the hook does nothing.",
                    f"Delete {desired}/{h}."
                ))
            else:
                # Check executable
                import os
                if not os.access(target, os.X_OK):
                    findings.append(finding(
                        f"git-hooks.not-executable.{h}", "medium",
                        f"{h} hook is not executable",
                        f"{target}: chmod -x",
                        {"kind": "fix", "patch": f"chmod +x {target.relative_to(repo)}"},
                        "Non-executable hooks are silently skipped by git.",
                        ""
                    ))
    elif hp == "":
        findings.append(finding(
            "git-hooks.hooksPath.unset", "medium",
            "core.hooksPath not set",
            "git config core.hooksPath: empty",
            {"kind": "git-config", "patch": f"git config core.hooksPath {desired}"},
            "Without core.hooksPath, hooks live under .git/hooks/ (untracked) — version-control them under .claude/.",
            "git config --unset core.hooksPath"
        ))
    elif hp.endswith(".husky") or "husky" in hp.lower():
        findings.append(finding(
            "git-hooks.husky-collision", "high",
            f"core.hooksPath is set to a Husky path: {hp}",
            f"git config core.hooksPath: {hp}",
            {"kind": "advice", "patch": "migrate Husky hooks into .claude/scripts/git-hooks/ or chain via wrapper"},
            "cc-audit will NOT silently overwrite Husky's config — choose migrate or chain.",
            "n/a"
        ))
    else:
        findings.append(finding(
            "git-hooks.hooksPath.foreign", "medium",
            f"core.hooksPath is `{hp}` (expected `{desired}`)",
            f"git config core.hooksPath: {hp}",
            {"kind": "advice", "patch": f"either migrate hooks under {hp} into {desired}/, or accept the foreign path"},
            "Foreign hook paths bypass the strict baseline.",
            ""
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
