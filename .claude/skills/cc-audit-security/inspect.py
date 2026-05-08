#!/usr/bin/env python3
"""cc-audit-security inspect.py — secrets, PII, IaC enforcement detector."""

import json
import shutil
import sys
from pathlib import Path

SCHEMA = "v1"
AREA = "security"

CONTENT_DENIES = [
    "Read(./.env)",
    "Read(./.env.*)",
    "Read(~/.aws/credentials)",
    "Read(~/.aws/config)",
    "Read(~/.ssh/**)",
    "Read(./**/*.pem)",
    "Read(./**/*.key)",
    "Read(./secrets/**)",
]


def load_settings(repo: Path) -> dict:
    p = repo / ".claude" / "settings.json"
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}


def hooks_calls(repo: Path, needle: str) -> bool:
    s = load_settings(repo)
    flat = json.dumps(s)
    return needle in flat


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
                "skipped": [{"id": "security.no-settings", "reason": ".claude/settings.json absent"}]}

    deny = set((s.get("permissions") or {}).get("deny") or [])

    for rule in CONTENT_DENIES:
        if rule not in deny:
            findings.append(finding(
                f"security.deny.missing.{rule}", "high",
                f"filesystem deny missing: `{rule}`",
                f".claude/settings.json: permissions.deny lacks {rule}",
                {"kind": "settings-patch", "patch": f"append `{rule}` to permissions.deny"},
                "Reads of secret/credential paths should refuse without prompt — surface area for prompt-injected exfil.",
                f"Remove `{rule}` from deny."
            ))

    # Gitleaks (recommended)
    if not shutil.which("gitleaks"):
        findings.append(finding(
            "security.gitleaks.not-installed", "medium",
            "gitleaks binary not on PATH",
            "shutil.which('gitleaks') returned None",
            {"kind": "advice", "patch": "brew install gitleaks  (macOS) — or apt-get / scoop equivalent"},
            "gitleaks v13+ ships 174 default rules. Regex fallback in guards/secret-scan.sh runs anyway, but gitleaks is more precise.",
            "n/a (advisory only — nothing was changed)."
        ))

    # PII masking on Stop
    if not hooks_calls(repo, "pii-mask"):
        findings.append(finding(
            "security.stop-pii-mask.absent", "medium",
            "Stop hook does not invoke PII mask",
            ".claude/settings.json: hooks.Stop does not reference pii-mask",
            {"kind": "settings-patch", "patch": "wire stop pii-mask via hooks.py dispatcher"},
            "Transcripts and metrics logs may contain emails, phones, JWTs, AWS keys.",
            "Remove the hook entry."
        ))

    # IaC plan-before-apply
    if not hooks_calls(repo, "check-iac-plan"):
        findings.append(finding(
            "security.iac-plan-marker.absent", "medium",
            "PreToolUse:Bash does not enforce IaC plan-before-apply",
            ".claude/settings.json: hooks.PreToolUse does not reference check-iac-plan",
            {"kind": "settings-patch", "patch": "wire pre-tool-use check-iac-plan via hooks.py"},
            "Without it, terraform apply / cdk deploy / pulumi up can run without a recent plan.",
            "Remove the hook entry."
        ))

    # Secret-scan guard present?
    if not (repo / ".claude" / "scripts" / "guards" / "secret-scan.sh").exists():
        findings.append(finding(
            "security.regex-fallback.absent", "high",
            "secret-scan guard missing",
            ".claude/scripts/guards/secret-scan.sh: not found",
            {"kind": "scaffold", "patch": "render templates/guards/secret-scan.sh"},
            "Council fix: regex fallback must run by default — never a 'secret-scan-off' state.",
            "Delete the file."
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
