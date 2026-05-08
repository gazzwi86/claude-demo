#!/usr/bin/env python3
"""cc-audit-permissions inspect.py — permissions structure detector."""

import json
import sys
from pathlib import Path

SCHEMA = "v1"
AREA = "permissions"

ALWAYS_ALLOW = [
    "Bash(git status)", "Bash(git diff *)", "Bash(git log *)",
    "Bash(ls *)", "Bash(cat *)", "Bash(grep *)", "Bash(rg *)",
    "Read", "Edit", "Write",
]

STACK_ALLOW = {
    "node": ["Bash(npm run *)", "Bash(npm test *)", "Bash(pnpm *)", "Bash(yarn *)"],
    "python": ["Bash(pytest *)", "Bash(uv *)", "Bash(ruff *)", "Bash(python -m *)"],
    "go": ["Bash(go test *)", "Bash(go build *)", "Bash(go run *)"],
    "rust": ["Bash(cargo *)"],
}

STACK_FILES = {
    "node": "package.json",
    "python": "pyproject.toml",
    "go": "go.mod",
    "rust": "Cargo.toml",
}

BASELINE_ASK = [
    "Bash(git push *)",
    "Bash(git rebase *)",
    "Bash(npm publish *)",
    "Bash(docker push *)",
    "Bash(terraform apply *)",
]

BASELINE_DENY = [
    "Bash(rm -rf *)", "Bash(sudo *)",
    "Bash(curl * | sh)", "Bash(wget * | sh)",
    "Bash(git push --force *)", "Bash(git reset --hard *)",
    "Bash(terraform destroy *)", "Bash(kubectl delete *)",
]


def load_settings(repo: Path) -> dict:
    p = repo / ".claude" / "settings.json"
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}


def detect_stacks(repo: Path) -> list:
    found = []
    for stack, marker in STACK_FILES.items():
        if (repo / marker).exists():
            found.append(stack)
    if any(repo.glob("*/package.json")):
        if "node" not in found:
            found.append("node")
    return found


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
                "skipped": [{"id": "permissions.no-settings", "reason": ".claude/settings.json absent"}]}

    perms = s.get("permissions") or {}
    allow = set(perms.get("allow") or [])
    ask = set(perms.get("ask") or [])
    deny = set(perms.get("deny") or [])

    # Always-allow seeds
    for rule in ALWAYS_ALLOW:
        if rule not in allow:
            findings.append(finding(
                f"permissions.allow.missing-baseline.{rule}", "low",
                f"baseline allow missing: `{rule}`",
                f".claude/settings.json: permissions.allow lacks {rule}",
                {"kind": "settings-patch", "patch": f"append `{rule}` to permissions.allow"},
                "Without these the user gets prompted on every routine read/grep — friction tax.",
                "Remove from allow."
            ))

    # Per-stack seeds
    stacks = detect_stacks(repo)
    for stack in stacks:
        for rule in STACK_ALLOW.get(stack, []):
            if rule not in allow:
                findings.append(finding(
                    f"permissions.allow.missing-stack.{stack}.{rule}", "low",
                    f"{stack} allow seed missing: `{rule}`",
                    f"{STACK_FILES[stack]} present; permissions.allow lacks {rule}",
                    {"kind": "settings-patch", "patch": f"append `{rule}` to permissions.allow"},
                    f"{stack} stack detected; routine commands shouldn't prompt.",
                    "Remove from allow."
                ))

    # Asks
    for rule in BASELINE_ASK:
        if rule not in ask:
            findings.append(finding(
                f"permissions.ask.missing.{rule}", "medium",
                f"baseline ask missing: `{rule}`",
                f".claude/settings.json: permissions.ask lacks {rule}",
                {"kind": "settings-patch", "patch": f"append `{rule}` to permissions.ask"},
                "These commands have material side effects — confirm before run.",
                "Remove from ask."
            ))

    # Denies (structure-level only — content-level filesystem denies are owned by cc-audit-security)
    for rule in BASELINE_DENY:
        if rule not in deny:
            findings.append(finding(
                f"permissions.deny.missing.{rule}", "high",
                f"baseline deny missing: `{rule}`",
                f".claude/settings.json: permissions.deny lacks {rule}",
                {"kind": "settings-patch", "patch": f"append `{rule}` to permissions.deny"},
                "Destructive irreversible op; aligns with strict-by-default profile.",
                "Remove from deny."
            ))

    # Overly broad
    if "Bash(*)" in allow:
        findings.append(finding(
            "permissions.allow.too-broad", "high",
            "`Bash(*)` in allow is too broad",
            ".claude/settings.json: permissions.allow contains Bash(*)",
            {"kind": "settings-patch", "patch": "replace Bash(*) with explicit allows"},
            "Bash(*) auto-approves every shell command including destructive ones.",
            "Restore Bash(*)."
        ))

    # defaultMode
    if "defaultMode" not in perms:
        findings.append(finding(
            "permissions.defaultMode.absent", "low",
            "permissions.defaultMode not set",
            ".claude/settings.json: permissions.defaultMode absent",
            {"kind": "settings-patch", "patch": 'set defaultMode: "default"'},
            "Implicit defaults change between releases; pin it.",
            "Remove the field."
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
