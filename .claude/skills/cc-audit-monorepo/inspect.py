#!/usr/bin/env python3
"""cc-audit-monorepo inspect.py — workspace + per-area CLAUDE.md detector."""

import json
import sys
from pathlib import Path

SCHEMA = "v1"
AREA = "monorepo"

WORKSPACE_MARKERS = ["pnpm-workspace.yaml", "lerna.json", "nx.json", "turbo.json"]
WORKSPACE_DIRS = ["apps", "packages", "services"]
MANIFEST_NAMES = ["package.json", "pyproject.toml", "Cargo.toml", "go.mod"]


def detect_monorepo(repo: Path) -> tuple:
    """Return (is_monorepo, signals)."""
    signals = []

    for m in WORKSPACE_MARKERS:
        if (repo / m).exists():
            signals.append(m)

    for d in WORKSPACE_DIRS:
        if (repo / d).is_dir():
            entries = [p for p in (repo / d).iterdir() if p.is_dir()]
            if entries:
                signals.append(f"{d}/ ({len(entries)} children)")

    # Multiple language manifests at depth ≥1
    for name in MANIFEST_NAMES:
        matches = [p for p in repo.glob(f"*/{name}")] + \
                  [p for p in repo.glob(f"*/*/{name}")]
        matches = [p for p in matches if "node_modules" not in p.parts]
        if len(matches) >= 2:
            signals.append(f"{len(matches)}x {name} at depth ≥1")

    return (len(signals) > 0, signals)


def list_area_dirs(repo: Path) -> list:
    out = []
    for d in WORKSPACE_DIRS:
        wd = repo / d
        if not wd.is_dir():
            continue
        for p in sorted(wd.iterdir()):
            if p.is_dir() and not p.name.startswith("."):
                out.append(p)
    return out


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
    return "paths:" in text[:end]


def finding(fid, severity, title, evidence, remediation, rationale, rollback=""):
    return {
        "id": fid, "severity": severity, "title": title, "evidence": evidence,
        "remediation": remediation, "rationale": rationale, "rollback": rollback,
    }


def inspect(repo: Path) -> dict:
    findings = []
    skipped = []

    is_monorepo, signals = detect_monorepo(repo)
    if not is_monorepo:
        skipped.append({"id": "monorepo.single-package",
                        "reason": "single-package repo; monorepo checks omitted"})
        return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped}

    # Per-area CLAUDE.md
    for area_dir in list_area_dirs(repo):
        cm = area_dir / "CLAUDE.md"
        rel = area_dir.relative_to(repo)
        if not cm.exists():
            findings.append(finding(
                f"monorepo.per-area-claude-md.missing.{rel}", "medium",
                f"per-area CLAUDE.md missing: {rel}/CLAUDE.md",
                f"{rel}: directory has no CLAUDE.md",
                {"kind": "scaffold", "patch": f"create {rel}/CLAUDE.md (≤200 lines) with area-specific conventions"},
                "Per-area CLAUDE.md only loads when files in that area are touched — far more efficient than top-level guidance.",
                f"Delete {rel}/CLAUDE.md."
            ))

    # Rules without paths globs (in monorepo, this is more pressing)
    rules = repo / ".claude" / "rules"
    if rules.is_dir():
        for r in rules.glob("*.md"):
            if not has_paths_frontmatter(r):
                findings.append(finding(
                    f"monorepo.rules.no-paths.{r.stem}", "medium",
                    f"monorepo rule without paths glob: {r.name}",
                    f".claude/rules/{r.name}: frontmatter has no `paths:` field",
                    {"kind": "frontmatter", "patch": f"add `paths:` glob narrowed to relevant area"},
                    "In a monorepo, ungloboed rules waste context on unrelated areas.",
                    ""
                ))

    return {"area": AREA, "version": SCHEMA, "findings": findings, "skipped": skipped,
            "signals": signals}


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
