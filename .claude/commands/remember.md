---
description: Save a project-scoped fact (decision, convention, project state, or external reference) to .claude/memory/. Routes personal preferences to user-level memory instead.
arguments:
  - name: fact
    description: The fact to remember. Phrase it as you'd want it recalled later.
    required: true
---

Invoke the `project-memory` skill on the following fact and follow its write protocol exactly.

**Fact:** $ARGUMENTS

Steps:
1. Apply the routing discriminator from the skill body. Decide: project memory, user memory, or split.
2. If project memory: pick the right type (`project` | `decision` | `feedback` | `reference`), write a new file at `.claude/memory/<type>_<topic>.md`, add an index line to `.claude/memory/MEMORY.md`.
3. If user memory: do not write to `.claude/memory/`. Instead, write to `~/.claude/projects/-Users-gareth-Sites-claude-demo/memory/` following the user-level auto-memory rules in `~/.claude/CLAUDE.md`. Tell the user this was personal and went to user memory.
4. If split: write both halves to their respective places.
5. Before writing, run the do-not-save check from the skill. If the fact is already covered by `CLAUDE.md`, `rules/`, `ANATOMY.md`, or git history, refuse with a one-line explanation pointing to where it already lives.
6. Confirm in one line what you saved and where. Do not summarise the fact back.
