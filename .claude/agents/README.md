# `.claude/agents/` — custom subagents

Each `.md` file defines a specialised subagent. Claude (or the user) can
delegate work to one via the `Agent` tool with `subagent_type: <name>`.

## Available agents

| Agent | Model | Purpose | Tools |
|---|---|---|---|
| `api-designer` | Sonnet | Designs Fastify REST endpoints following project conventions (shared zod schemas, AppError, authGuard, app.inject() tests). | Read, Edit, Write, Glob, Grep |
| `product-owner` | Sonnet | Elicits requirements and produces Brief, PRD, and Epics. Activate before any technical design begins. | Read, Write, Edit |
| `qa` | Sonnet | Writes and diagnoses Playwright BDD tests — feature files, step definitions, page objects, E2E failure diagnosis. | Read, Write, Edit, Bash, Glob, Grep |
| `security-reviewer` | Opus | Scans for OWASP Top 10 vulnerabilities, scores confidence, produces structured `SECURITY_REPORT.md`. | Read, Bash, Glob, Grep |
| `tech-architect` | Sonnet | Translates approved specs into architecture diagrams, API contracts, data models, and task briefs. Activate after `product-owner` approves. | Read, Write, Edit, Bash |
| `test-writer` | Haiku | Generates Vitest tests for existing TypeScript code in apps/api, apps/web, and packages/shared. | Read, Write, Glob, Grep, Bash |

## Frontmatter shape

```yaml
---
name: agent-name
description: One-line summary. Used by Claude to decide whether to delegate.
tools: Read, Edit, Write, Bash
---
```

## When the existing agents are useful

- `product-owner` → `tech-architect` is the natural spec pipeline: PO elicits and writes the PRD, architect converts it into task briefs.
- `api-designer` is good for fanning out to design *before* you write code. Pair it with Plan mode.
- `qa` handles the full Playwright BDD surface — feature files through to failure diagnosis.
- `security-reviewer` runs OWASP Top 10 scans; pairs with the `/security-remediate` skill to apply fixes.
- `test-writer` back-fills Vitest tests on finished modules — point it at one file and ask for happy-path + 2 edge cases.

## How to add one

1. Drop a `<name>.md` here with the frontmatter above.
2. Body: the system prompt the agent will run with.
3. Call it via `Agent(subagent_type="<name>", prompt="...")`.

For long-running multi-agent collaboration, see the agent-teams + worktrees
section in [`../README.md`](../README.md). Note that the team experiment in
this repo blocked on permission prompts — there's a real UX sharp edge there.
