---
name: cc-audit-skills
description: Audits .claude/skills/, .claude/agents/, .claude/commands/ for frontmatter quality, body size, third-person voice, and trigger specificity. Flags weak descriptions, oversize bodies (>500 lines), second-person voice, and deeply-nested file references. Use when the user invokes /cc-audit, asks to "review skill frontmatter", "audit skills", "check skill bodies", or "find weak skill descriptions".
when_to_use: Orchestrator fan-out for /cc-audit, or a direct request to audit skills/agents/commands.
allowed-tools: ["Read", "Glob", "Grep"]
---

# cc-audit-skills

Inspects every skill, agent, and command for frontmatter and body quality.

## Run

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit-skills/inspect.py <repo-root> --json
```

## What it checks

- `name` ≤64 chars, lowercase + hyphen only.
- `description` ≤1024 chars, third-person.
- `description` includes specific trigger phrases (more than one keyword).
- Body ≤500 lines.
- Voice: third person throughout (flags second-person "you should...").
- File references max one level deep (`see other-skill.md` not `see foo/bar/baz.md`).

## Description-as-trigger

The description is what the model sees when deciding to invoke. Be specific. Include key terms a user would type. Weak: "Helps with X." Strong: "Audits .claude/settings.json against the strict-by-default Claude Code baseline. Use when user invokes /cc-audit or asks to 'review .claude/settings.json'."

## Common mistakes flagged

- Weak descriptions ("Does X").
- Body > 500 lines (paste long reference docs into a sibling file and link).
- Second-person voice ("you should...", "I will...").
- Deeply-nested file refs.
- Multiple focus areas in one skill (decomposition opportunity).

## Gotchas

- Frontmatter `disable-model-invocation: true` is rare and intentional — not a finding.
- `allowed-tools` array narrows the agent's tool surface; absence is not a finding (defaults are reasonable).

See [best-practises.md](best-practises.md).
