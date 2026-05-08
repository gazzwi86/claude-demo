#!/usr/bin/env python3
"""cc-audit-skills inspect.py — skill/agent/command frontmatter + body detector."""

import json
import re
import sys
from pathlib import Path

SCHEMA = "v1"
AREA = "skills"

NAME_RX = re.compile(r"^[a-z][a-z0-9-]{0,63}$")
SECOND_PERSON_RX = re.compile(r"\b(you should|you must|your task|i will|i'll|i am)\b", re.IGNORECASE)


def parse_frontmatter(text: str) -> dict:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    fm = text[3:end].strip()
    out = {}
    for line in fm.splitlines():
        if ":" not in line:
            continue
        k, _, v = line.partition(":")
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def finding(fid, severity, title, evidence, remediation, rationale, rollback=""):
    return {
        "id": fid, "severity": severity, "title": title, "evidence": evidence,
        "remediation": remediation, "rationale": rationale, "rollback": rollback,
    }


def inspect_one(p: Path, repo: Path, kind: str, findings: list):
    try:
        text = p.read_text(encoding="utf-8")
    except Exception:
        return
    rel = str(p.relative_to(repo))
    fm = parse_frontmatter(text)
    body = text.split("\n---", 2)[-1] if text.startswith("---") else text

    name = fm.get("name", "")
    desc = fm.get("description", "")

    if not NAME_RX.match(name):
        findings.append(finding(
            f"skills.frontmatter.bad-name.{rel}", "medium",
            f"{kind} `{rel}` has invalid name `{name}`",
            f"{rel}: name must match ^[a-z][a-z0-9-]{{0,63}}$",
            {"kind": "frontmatter", "patch": "rename to lowercase + hyphen, ≤64 chars"},
            "Skill names are user-facing identifiers; restricted charset prevents collisions and shell-quoting issues.",
            "Restore the original name."
        ))

    if not desc:
        findings.append(finding(
            f"skills.frontmatter.no-description.{rel}", "high",
            f"{kind} `{rel}` has no description",
            f"{rel}: frontmatter `description` field absent",
            {"kind": "frontmatter", "patch": "add a third-person description with trigger phrases"},
            "Without a description, the model can't decide when to invoke the skill.",
            ""
        ))
    else:
        if len(desc) > 1024:
            findings.append(finding(
                f"skills.frontmatter.description-too-long.{rel}", "low",
                f"{kind} `{rel}` description is {len(desc)} chars (limit 1024)",
                f"{rel}: description exceeds 1024 chars",
                {"kind": "frontmatter", "patch": "trim description to ≤1024 chars"},
                "Hard cap; the harness truncates beyond this.",
                "Restore."
            ))
        if SECOND_PERSON_RX.search(desc):
            findings.append(finding(
                f"skills.frontmatter.second-person.{rel}", "low",
                f"{kind} `{rel}` description uses second person",
                f"{rel}: description matches /you should|i will/i",
                {"kind": "frontmatter", "patch": "rewrite in third person"},
                "Anthropic best-practices: skill descriptions must be third person.",
                "Restore."
            ))
        if len(desc.split()) < 8:
            findings.append(finding(
                f"skills.frontmatter.weak-description.{rel}", "medium",
                f"{kind} `{rel}` description is too terse ({len(desc.split())} words)",
                f"{rel}: description = {desc!r}",
                {"kind": "frontmatter", "patch": "expand with specific trigger phrases"},
                "Description is what the model uses to decide invocation. Vague descriptions get skipped.",
                "Restore."
            ))

    body_lines = body.count("\n")
    if body_lines > 500:
        findings.append(finding(
            f"skills.body.oversize.{rel}", "medium",
            f"{kind} `{rel}` body is {body_lines} lines (limit 500)",
            f"{rel}: {body_lines} body lines",
            {"kind": "split", "patch": "extract reference content to a sibling file and link one level deep"},
            "Long bodies dilute the trigger signal and slow model decisions.",
            "Restore."
        ))


def inspect(repo: Path) -> dict:
    findings = []
    skipped = []

    for sub, kind in (("skills", "skill"), ("agents", "agent"), ("commands", "command")):
        d = repo / ".claude" / sub
        if not d.is_dir():
            skipped.append({"id": f"skills.no-{sub}", "reason": f".claude/{sub}/ absent"})
            continue
        for p in d.rglob("*.md"):
            if "node_modules" in p.parts:
                continue
            inspect_one(p, repo, kind, findings)

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
