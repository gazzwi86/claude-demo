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


def _skill_files(root: Path, sub: str):
    """Yield only the canonical artifact files under .claude/{skills,agents,commands}/.

    - skills/<name>/SKILL.md is the only skill file; README.md, council.md,
      best-practises.md, and anything under templates/ are supporting docs.
    - agents/<name>.md and commands/<name>.md are direct children, never nested.
    - README.md at any level is documentation, never an artifact.
    """
    if sub == "skills":
        for skill_dir in root.iterdir():
            if not skill_dir.is_dir():
                continue
            if "node_modules" in skill_dir.parts:
                continue
            skill_md = skill_dir / "SKILL.md"
            if skill_md.exists():
                yield skill_md
        return
    for p in root.iterdir():
        if not p.is_file() or p.suffix != ".md":
            continue
        if p.name == "README.md":
            continue
        yield p


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


def detect_workflow_surface(repo: Path, findings: list) -> None:
    """Detect missing workflow surface: project-memory, /anatomy, /open-pr, etc.

    Each missing pattern emits a Finding whose remediation routes to
    `cc-scaffold --cluster=<name>` so the agent runs the research-driven
    scaffolder rather than copying static templates.
    """
    skills_dir = repo / ".claude" / "skills"
    commands_dir = repo / ".claude" / "commands"
    agents_dir = repo / ".claude" / "agents"
    memory_dir = repo / ".claude" / "memory"

    project_memory = skills_dir / "project-memory" / "SKILL.md"
    has_remember = (commands_dir / "remember.md").exists()
    if not project_memory.exists() or not has_remember or not memory_dir.is_dir():
        findings.append(finding(
            "skills.no-project-memory", "medium",
            "missing project-memory pattern (skill + /remember + .claude/memory/)",
            f"absent: {', '.join(p for p, exists in [('skills/project-memory', project_memory.exists()), ('commands/remember.md', has_remember), ('memory/', memory_dir.is_dir())] if not exists)}",
            {"kind": "scaffold", "patch": "run `/cc-scaffold --cluster=memory` to scaffold the project-memory skill, /remember command, and .claude/memory/MEMORY.md index"},
            "Project memory captures decisions, conventions, and external-system pointers that grep can't recover; the pattern compounds across sessions.",
            "Remove the scaffolded files."
        ))

    anatomy_cmd = (commands_dir / "anatomy.md").exists()
    docs_wiki = (repo / "docs" / "wiki").is_dir()
    if not anatomy_cmd or not docs_wiki:
        findings.append(finding(
            "skills.no-anatomy", "low",
            "missing /anatomy + docs/wiki pattern",
            f"absent: {', '.join(p for p, exists in [('commands/anatomy.md', anatomy_cmd), ('docs/wiki/', docs_wiki)] if not exists)}",
            {"kind": "scaffold", "patch": "run `/cc-scaffold --cluster=wiki` to scaffold the /anatomy command, the wiki module, and docs/wiki/"},
            "ANATOMY.md + docs/wiki/ is a persistent, compounding orientation artifact maintained by the model itself.",
            "Remove the scaffolded files."
        ))

    write_skills = list(skills_dir.glob("write-*")) if skills_dir.is_dir() else []
    if not write_skills:
        findings.append(finding(
            "skills.no-write-helpers", "low",
            "no write-* helper skills (UI / API / test scaffolding)",
            f"{skills_dir.relative_to(repo)}: no skills matching write-*",
            {"kind": "scaffold", "patch": "run `/cc-scaffold --cluster=skills` to research the detected stack and scaffold write-ui, write-api, write-test skill skeletons"},
            "Stack-aware write-* skills give Claude consistent scaffolding for new components, routes, and tests; cc-scaffold researches current best-practice for the detected stack.",
            "Remove the scaffolded skills."
        ))

    needed_workflow_cmds = ("open-pr", "check-health")
    missing_workflow = [c for c in needed_workflow_cmds if not (commands_dir / f"{c}.md").exists()]
    if missing_workflow:
        findings.append(finding(
            "skills.no-workflow-commands", "low",
            f"missing workflow commands: /{', /'.join(missing_workflow)}",
            f"absent: commands/{{{','.join(missing_workflow)}}}.md",
            {"kind": "scaffold", "patch": "run `/cc-scaffold --cluster=commands` to scaffold the missing workflow commands with stack-appropriate defaults"},
            "Workflow commands codify the team's PR and smoke-test rituals so they don't have to be re-explained in every session.",
            "Remove the scaffolded commands."
        ))

    needed_agents = ("api-designer", "test-writer")
    missing_agents = [a for a in needed_agents if not (agents_dir / f"{a}.md").exists()]
    if missing_agents:
        findings.append(finding(
            "skills.no-named-agents", "low",
            f"missing named subagents: {', '.join(missing_agents)}",
            f"absent: agents/{{{','.join(missing_agents)}}}.md",
            {"kind": "scaffold", "patch": "run `/cc-scaffold --cluster=agents` to scaffold the api-designer and test-writer subagents"},
            "Named subagents let Claude delegate API design and test authoring to specialised contexts.",
            "Remove the scaffolded agents."
        ))


def inspect(repo: Path) -> dict:
    findings = []
    skipped = []

    for sub, kind in (("skills", "skill"), ("agents", "agent"), ("commands", "command")):
        d = repo / ".claude" / sub
        if not d.is_dir():
            skipped.append({"id": f"skills.no-{sub}", "reason": f".claude/{sub}/ absent"})
            continue
        for p in _skill_files(d, sub):
            inspect_one(p, repo, kind, findings)

    detect_workflow_surface(repo, findings)

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
