---
name: cc-scaffold is research-driven, not template-shipping
description: cc-scaffold templates intentionally ship NO stack-specific tool choices; the agent researches current best-practice via context7 + WebSearch at apply time. Reverse this and the scaffold ages poorly.
type: decision
created: 2026-05-08
---

cc-scaffold's templates contain only `{{PLACEHOLDER}}` markers and shape
constraints. The agent picks the actual tool (eslint plugin, test
runner, schema lib, complexity rule) by querying context7 and WebSearch
in parallel and reconciling the results.

**Why:** Stack-specific tooling drifts faster than templates can be
maintained. Shipping a hardcoded "use eslint-plugin-sonarjs" choice
means the next time SonarSource changes the package name, splits the
plugin, or a better option emerges, every cc-scaffold-bootstrapped repo
ships stale advice. The MCQ during scope-setting explicitly weighed
"stack bundles in templates/" vs "research at apply time" and chose
research; the user's exact words: "we should add the need for the tool
to research the web for a given stack to inform and keep up to date
with the best approaches."

**How to apply:** When tempted to add a stack-specific file under
`.claude/skills/cc-scaffold/templates/`, stop. Either generalize it to
a placeholder-driven shape, or move the choice into the SKILL.md as a
research target the agent resolves at apply time. Same rule for
cc-audit's `templates/`: ship structure (dispatcher, modules layout,
rule shape, security guards) but never a specific framework's plugin
list.

The single exception is `apps/web/eslint.complexity.config.js` in this
repo — a deliberate worked example demonstrating the pattern, not a
template. cc-scaffold's `complexity` cluster generalises it via
research, never copies it.
