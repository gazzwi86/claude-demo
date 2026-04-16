# Claude Code Demo Guide

A walkthrough script for demoing Claude Code features to engineers.

---

## 1. Project Configuration (`CLAUDE.md` — Progressive Disclosure)

**Talking points:**
- `CLAUDE.md` at the repo root is always loaded — put project-wide context here
- Subdirectory `CLAUDE.md` files (e.g. `src/CLAUDE.md`, `tests/CLAUDE.md`) only load when Claude works in that directory
- This keeps context focused and token-efficient
- Great for monorepos where different areas have different conventions

**Files to show:**
- `CLAUDE.md` — root project context
- `src/CLAUDE.md` — source-specific patterns
- `tests/CLAUDE.md` — testing conventions

**Demo:** Ask Claude to "add a DELETE endpoint for users" — it will read the root CLAUDE.md and the src/CLAUDE.md but not the tests one until it writes tests.

---

## 2. Settings (`settings.json` vs `settings.local.json`)

**Talking points:**
- `.claude/settings.json` — committed, shared with the team
- `.claude/settings.local.json` — gitignored, personal overrides
- Settings merge: local overrides shared
- Key configurable items:
  - `permissions.allow` — pre-approve specific tool patterns
  - `permissions.deny` — block dangerous operations
  - `ignorePaths` — prevent Claude from reading sensitive files (`.env`, keys)
  - `env` — set environment variables for the session
  - `hooks` — automated checks on tool use
  - `mcpServers` — project-level MCP servers

**Files to show:**
- `.claude/settings.json` — team settings
- `.claude/settings.local.json` — personal settings (note it's gitignored)

---

## 3. Rules Directory (`.claude/rules/`)

**Talking points:**
- Rules files are always loaded into context (unlike CLAUDE.md which is path-dependent)
- Use for cross-cutting concerns: security policies, style guides, testing requirements
- Each file is a focused topic — keeps things modular
- Rules are enforced by Claude reading them, not by tooling

**Files to show:**
- `.claude/rules/security.md`
- `.claude/rules/testing.md`
- `.claude/rules/code-style.md`

---

## 4. Hooks

**Talking points:**
- Hooks run shell commands in response to Claude Code events
- `PreToolUse` — runs before a tool executes (can block with exit code 2)
- `PostToolUse` — runs after a tool executes
- `Notification` — runs when Claude sends a notification
- Matchers filter which tools trigger the hook (regex on tool name)
- Use cases: secret scanning, auto-formatting, notifications, audit logging

**Demo:** Show the secret-scanning hook in action:
1. Show `scripts/check-no-secrets.js`
2. Show the hook config in `.claude/settings.json`
3. Ask Claude to "add an API key constant to users.js" — the hook should block it

---

## 5. Custom Agents (`.claude/agents/`)

**Talking points:**
- Markdown files that define specialized sub-agents
- Can specify: model, available tools, system prompt, constraints
- Claude delegates to these agents for specific tasks
- Useful for: code review, test writing, API design, migration helpers

**Files to show:**
- `.claude/agents/api-designer.md` — uses Sonnet, focused on REST design
- `.claude/agents/test-writer.md` — uses Haiku, focused on test generation

**Demo:** Type `/agent:test-writer "write tests for the validate utils"`

---

## 6. Custom Slash Commands (`.claude/commands/`)

**Talking points:**
- Reusable prompts triggered with `/project:<command-name>`
- Can accept arguments defined in frontmatter
- Great for standardising common workflows across the team

**Files to show:**
- `.claude/commands/add-endpoint.md` — parameterised endpoint scaffolding
- `.claude/commands/check-health.md` — server health check

**Demo:** Type `/project:add-endpoint products`

---

## 7. MCP Servers (Project-Level)

**Talking points:**
- MCP (Model Context Protocol) servers extend Claude's capabilities
- Configured in `.claude/settings.json` under `mcpServers`
- Project-level = every team member gets the same tools
- Example: context7 for fetching live documentation

**CLI demo — adding an MCP server:**
```bash
claude mcp add my-server npx -y @some/mcp-server
```

**CLI demo — listing MCP servers:**
```bash
claude mcp list
```

---

## 8. Installing Plugins

**Talking points:**
- Plugins are community/first-party extensions installed via CLI
- Project-level plugins are shared with all users via settings

**CLI demo:**
```bash
# Install a plugin for the project
claude install @anthropic-ai/context7-mcp

# List installed plugins
claude plugins list
```

---

## 9. CLI Features Demo

### Auto Mode
```bash
# Enable auto mode (skip permission prompts)
claude --auto

# Or enable for specific tools
claude --allowedTools "Edit,Write,Read,Bash(npm test)"
```

### Plan Mode
- Press `Shift+Tab` to toggle plan mode in the REPL
- Or start with: `claude --plan`
- Claude will propose a plan before making changes

### Model Selection
```bash
# Select a specific model
claude --model sonnet

# Or switch mid-conversation with /model
```

### Built-in Review Commands
```bash
# Simplify recently changed code
# In the REPL, type: /simplify

# Security review of current branch changes
# In the REPL, type: /security-review

# Code review a PR
# In the REPL, type: /review
```

### Headless / CI Mode
```bash
# Run a one-shot prompt (great for CI/CD)
claude -p "list all TODO comments in this project" --output-format json

# Pipe input
echo "explain this error" | claude -p
```

### Context Mentions
- `@file:src/routes/users.js` — attach a specific file
- `@url:https://example.com/docs` — fetch and attach a URL
- `@git:main..HEAD` — attach git diff

### Other Useful Features
- `/compact` — compress conversation to free up context
- `/init` — bootstrap a CLAUDE.md from the codebase
- `/cost` — see token usage and cost
- `Esc` — interrupt Claude mid-response
- `Shift+Tab` — toggle plan mode

---

## 10. Project File Tree (for reference)

```
claude-demo/
├── CLAUDE.md                          # Root project context
├── DEMO_GUIDE.md                      # This file
├── package.json
├── .gitignore
├── .claude/
│   ├── settings.json                  # Shared team settings
│   ├── settings.local.json            # Personal overrides (gitignored)
│   ├── rules/
│   │   ├── security.md                # Security rules
│   │   ├── testing.md                 # Testing rules
│   │   └── code-style.md             # Code style rules
│   ├── agents/
│   │   ├── api-designer.md            # API design sub-agent
│   │   └── test-writer.md             # Test writing sub-agent
│   └── commands/
│       ├── add-endpoint.md            # Slash command: scaffold endpoint
│       └── check-health.md            # Slash command: health check
├── scripts/
│   └── check-no-secrets.js            # Hook: secret detection
├── src/
│   ├── CLAUDE.md                      # Source-specific context
│   ├── index.js                       # Entry point
│   ├── routes/
│   │   ├── index.js                   # Router
│   │   ├── users.js                   # User endpoints
│   │   └── health.js                  # Health check
│   ├── models/
│   │   └── user.js                    # User data store
│   ├── middleware/
│   │   └── logger.js                  # Request logger
│   └── utils/
│       └── validate.js                # Input validation helpers
└── tests/
    ├── CLAUDE.md                      # Test-specific context
    └── users.test.js                  # User model tests
```

---

## Things You Might Be Missing (Bonus Topics)

- **Memory system** — Claude remembers context across conversations in `.claude/projects/`
- **Worktrees** — agents can work in isolated git worktrees (`isolation: "worktree"`)
- **Keybindings** — customise shortcuts in `~/.claude/keybindings.json`
- **Cost tracking** — visible in the UI, or via `/cost`
- **Compact mode** — `/compact` to compress conversation and reclaim context
- **`/init`** — auto-generate CLAUDE.md from your codebase
