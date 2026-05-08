---
name: Python Tooling
---

## Python Tooling Rules

- Use `uv` for all Python package management — never `pip`, `pipx`, or `python -m pip`
- Install tools: `uv tool install <pkg>` or `uvx <pkg>` for one-shot runs
- Install libraries: `uv add <pkg>` (in a uv project) or `uv pip install --system <pkg>` (escape hatch only)
- For MCP servers in settings: `uvx <mcp-pkg>` — never `pip install <pkg>` followed by bare command
- Forbidden patterns in any file or Bash command:
  - `pip install`
  - `pip3 install`
  - `python -m pip`
  - `python3 -m pip`
  - `--break-system-packages` (smell: trying to bypass uv)
- Exception: `uv pip install` is allowed (it's the uv-compat subcommand)

Enforced deterministically by `.claude/scripts/modules/python_tooling.py` (PreToolUse on Edit|Write|Bash).
