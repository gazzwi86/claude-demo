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

    detect_complexity_gate(repo, findings)

    return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped}


COMPLEXITY_KEYWORDS = (
    # JS/TS
    "complexity", "cognitive-complexity", "sonarjs",
    # Python
    "radon", "mccabe", "max-complexity", "cyclomatic",
    # Rust
    "cognitive-complexity",
    # generic
    "lizard",
)


def detect_complexity_gate(repo: Path, findings: list) -> None:
    """Detect whether the pre-commit hook enforces a complexity / maintainability gate.

    The gate is stack-specific (eslint-plugin-sonarjs for TS/JS, ruff
    rule C901 / radon for Python, clippy lints for Rust, etc) so this
    detector only checks for the *presence* of any complexity-related
    keyword in the pre-commit script. Remediation routes to
    `/cc-scaffold --cluster=complexity` which researches the detected
    stack at apply time and scaffolds the appropriate gate.
    """
    pre_commit = repo / ".claude" / "scripts" / "git-hooks" / "pre-commit"
    if not pre_commit.exists():
        return  # the missing-pre-commit case is already covered above
    try:
        text = pre_commit.read_text(encoding="utf-8").lower()
    except OSError:
        return
    if any(k in text for k in COMPLEXITY_KEYWORDS):
        return
    findings.append(finding(
        "git-hooks.no-complexity-gate", "low",
        "pre-commit hook does not enforce a complexity / maintainability gate",
        ".claude/scripts/git-hooks/pre-commit: no reference to complexity, sonarjs, radon, mccabe, or similar",
        {"kind": "scaffold", "patch": "run `/cc-scaffold --cluster=complexity` — researches current best-practice complexity tooling for the detected stack and wires it into pre-commit"},
        "A maintainability gate stops Claude (and humans) from accreting hard-to-understand code. The right tool depends on the stack, so cc-scaffold researches it at apply time rather than shipping a fixed plugin choice.",
        "Remove the scaffolded eslint config / ruff rule / equivalent and the pre-commit step."
    ))


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
