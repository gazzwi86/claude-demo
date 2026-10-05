---
name: spec-writer
description: Writes spec documents section-by-section with HITL review — Brief, PRD, Epics. Invoked by product-owner agent or standalone for /spec command. Trigger phrases: "write a spec", "create a PRD", "write the brief", "document the requirements", "write user stories for".
---

# Spec Writer

The spec-writer skill produces structured specification documents incrementally,
presenting each section for human review before proceeding. It never writes a full
document in one pass.

## Input

The skill accepts either:

- **Elicited context** — the decision summary output from the elicit skill, or
- **Raw user input** — a free-text description of what the user wants to build.

If raw input is provided without prior elicitation, the skill pauses and offers to
invoke the elicit skill first via AskUserQuestion.

## Document order

The skill produces documents in this fixed sequence:

1. `docs/specs/brief.md` — using `templates/brief.md`
2. `docs/specs/prd.md` — using `templates/prd.md`
3. `docs/specs/epics/EPIC-NNN.md` — one file per epic, using `templates/epic.md`

The skill does not advance to the next document until the current one is fully approved.

## Section-by-section HITL loop

For each section in a document:

1. The skill writes the section content using the template as a guide.
2. The skill presents the section to the user with an AskUserQuestion:
   > "Section: <Name>. Review the draft above — Approve / Amend / Reject?"
3. **Approve** — moves to the next section.
4. **Amend** — user provides corrections; the skill rewrites and re-presents.
5. **Reject** — the skill discards the section, asks a clarifying question, and rewrites from scratch.

## Multi-part outputs

For sections that produce multiple items (epics list, user stories, requirements rows):

1. Present a numbered overview of all items (titles only) — wait for approval.
2. Present items 3–5 at a time for review.
3. Do not write the next batch until the current batch is approved.

## Templates

All templates live in `templates/`:

- `templates/brief.md` — Brief document template
- `templates/prd.md` — PRD template
- `templates/epic.md` — Epic template
- `templates/adr.md` — Architecture Decision Record template
- `templates/task.md` — Task brief template (used by tech-architect agent)

The skill reads the relevant template before writing each document. It never inlines
template content into its own body.

## Evaluation criteria

- The skill must never write more than one section without pausing for HITL.
- The skill must not advance from Brief to PRD without an explicit Approve on every Brief section.
- Multi-part sections (tables, epic lists) must present no more than five rows at a time.
- Every `{{PLACEHOLDER}}` in a template must be replaced — the skill must not emit placeholder text.
- The skill must not make architectural decisions; only product scope decisions belong here.
