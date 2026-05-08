# `.claude/agents/` — custom subagents

Each `.md` file defines a specialised subagent. Claude (or the user) can
delegate work to one via the `Agent` tool with `subagent_type: <name>`.

## Available agents

| Agent | Purpose | Tools |
|---|---|---|
| `api-designer` | Designs REST API endpoints following project conventions. Read-only by default — produces a spec, not code. | Read, Edit, Write, Glob, Grep |
| `test-writer` | Generates tests for existing code using Node's built-in test runner (or Vitest, depending on package). | Read, Write, Glob, Grep, Bash |

## Frontmatter shape

```yaml
---
name: agent-name
description: One-line summary. Used by Claude to decide whether to delegate.
tools: Read, Edit, Write, Bash
---
```

## When the existing agents are useful

- `api-designer` is good for fanning out to design *before* you write code. Pair it with Plan mode.
- `test-writer` is good for back-filling tests on a finished module — point it at one file and ask for happy-path + 2 edge cases.

Both are simple by design — the demo value is in showing how to wire and call them, not in the agents themselves.

## How to add one

1. Drop a `<name>.md` here with the frontmatter above.
2. Body: the system prompt the agent will run with.
3. Call it via `Agent(subagent_type="<name>", prompt="...")`.

For long-running multi-agent collaboration, see the agent-teams + worktrees
section in [`../README.md`](../README.md). Note that the team experiment in
this repo blocked on permission prompts — there's a real UX sharp edge there.
