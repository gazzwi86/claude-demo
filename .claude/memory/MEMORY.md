# Project Memory

Project-scoped, team-shared memory for the claude-demo monorepo. Committed to git so every teammate sees the same context the agent has learned.

**Routing:** facts about *this codebase, this team, this initiative, this incident, an external system this project uses* live here. Personal preferences, role, and tooling style live in user-level memory at `~/.claude/projects/*/memory/`.

The `project-memory` skill at `.claude/skills/project-memory/SKILL.md` governs all writes here. Use `/remember <fact>` for explicit saves.

## Index

- [cc-scaffold is research-driven, not template-shipping](decision_research_driven_scaffold.md) — templates ship placeholders only; agent picks the tool via context7 + WebSearch at apply time

<!-- Index entries: `- [Title](file.md) — one-line hook` — keep under 200 lines total -->
