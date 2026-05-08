#!/usr/bin/env python3
"""cc-audit-claude-md inspect.py — CLAUDE.md size + structure detector."""

import json
import re
import sys
from pathlib import Path

SCHEMA = "v1"
AREA = "claude-md"

TOP_LEVEL_LIMIT = 100
PER_FOLDER_LIMIT = 200

VERIFIABLE_RULE_PATTERNS = [
    (re.compile(r"(?i)cyclomatic complexity"), "complexity",
     "PostToolUse:Edit running `eslint --rule complexity`"),
    (re.compile(r"(?i)tests? must pass"), "tests-pass",
     "Stop hook running `npm test` if changed files include test paths"),
    (re.compile(r"(?i)no console\.log"), "no-console-log",
     "PostToolUse:Edit|Write regex check for console\\.log"),
]


def lines_of(p: Path) -> int:
    try:
        return len(p.read_text(encoding="utf-8").splitlines())
    except Exception:
        return 0


def has_paths_frontmatter(p: Path) -> bool:
    try:
        text = p.read_text(encoding="utf-8")
    except Exception:
        return False
    if not text.startswith("---"):
        return False
    end = text.find("\n---", 3)
    if end == -1:
        return False
    front = text[:end]
    return "paths:" in front


def finding(fid, severity, title, evidence, remediation, rationale, rollback=""):
    return {
        "id": fid, "severity": severity, "title": title, "evidence": evidence,
        "remediation": remediation, "rationale": rationale, "rollback": rollback,
    }


def inspect(repo: Path) -> dict:
    findings = []
    skipped = []

    top = repo / "CLAUDE.md"
    if top.exists():
        n = lines_of(top)
        if n > TOP_LEVEL_LIMIT:
            findings.append(finding(
                "claude-md.top.bloated", "high",
                f"top-level CLAUDE.md is {n} lines (limit {TOP_LEVEL_LIMIT})",
                f"CLAUDE.md: {n} lines",
                {"kind": "extract", "patch": "cluster headings → .claude/rules/<topic>.md with paths globs; top-level becomes navigation index"},
                "Anthropic guidance: bloated CLAUDE.md gets ignored.",
                "Restore the original CLAUDE.md from .claude/backup-<ts>/."
            ))

        text = top.read_text(encoding="utf-8")
        for rx, key, hook_proposal in VERIFIABLE_RULE_PATTERNS:
            if rx.search(text):
                findings.append(finding(
                    f"claude-md.lift-to-hook.{key}", "medium",
                    f"verifiable rule should be a hook, not a doc: `{key}`",
                    f"CLAUDE.md: matches /{rx.pattern}/",
                    {"kind": "hook", "patch": f"add {hook_proposal}"},
                    "Verifiable rules belong in deterministic hooks; CLAUDE.md is for guidance.",
                    "Remove the hook entry."
                ))

    # Per-folder
    for cm in repo.glob("**/CLAUDE.md"):
        if cm == top:
            continue
        if "node_modules" in cm.parts or ".git" in cm.parts:
            continue
        n = lines_of(cm)
        if n > PER_FOLDER_LIMIT:
            findings.append(finding(
                f"claude-md.folder.bloated.{cm.parent.name}", "medium",
                f"{cm.relative_to(repo)} is {n} lines (limit {PER_FOLDER_LIMIT})",
                f"{cm.relative_to(repo)}: {n} lines",
                {"kind": "extract", "patch": "split into multiple per-folder CLAUDE.md or extract to .claude/rules/"},
                "Folder-level CLAUDE.md still gets loaded when files in that area are touched — keep it tight.",
                "Restore from backup."
            ))

    # Rules without paths globs
    rules_dir = repo / ".claude" / "rules"
    if rules_dir.is_dir():
        for r in rules_dir.glob("*.md"):
            if not has_paths_frontmatter(r):
                findings.append(finding(
                    f"claude-md.rules.no-paths.{r.stem}", "low",
                    f".claude/rules/{r.name} lacks `paths:` frontmatter",
                    f"{r.relative_to(repo)}: frontmatter has no `paths:` field",
                    {"kind": "frontmatter", "patch": f"add `paths: [\"**/*\"]` (or narrower glob) to {r.name}"},
                    "Without paths, rules apply globally — wastes context on irrelevant files.",
                    "Remove the paths line."
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
