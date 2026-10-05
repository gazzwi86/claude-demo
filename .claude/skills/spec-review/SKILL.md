---
name: spec-review
description: Reviews Brief, PRD, Epics for completeness, consistency, and implementation-readiness before committing to technical design. Trigger phrases: "review the specs", "check if specs are ready", "validate the requirements", "is the brief complete".
---

# Spec Review

The spec-review skill audits specification documents against five quality categories.
It can be called standalone (`/spec-review`) or by the product-owner agent as a gate
before handing off to the tech-architect agent.

## Input

The skill reads from `docs/specs/`:

- `brief.md` — required
- `prd.md` — required
- `epics/EPIC-NNN.md` — one or more required

If any required document is missing, the skill immediately returns a Critical gap
for that document and halts further review of dependent categories.

## Review categories

The skill reviews one category at a time, presenting findings via AskUserQuestion
before moving to the next. Each category produces a verdict: **Pass**, **Warnings**, or **Critical**.

### Category 1 — Brief

- Mission statement names user, capability, and outcome.
- Problem and Vision sections are populated.
- Scope has both in-scope and out-of-scope items.
- Success criteria are measurable (contain a metric or observable outcome).
- No `{{PLACEHOLDER}}` tokens remain.

### Category 2 — PRD

- Every functional requirement is testable and bounded.
- Each user story names a persona, capability, and reason.
- NFRs cover quality, usability, and portability.
- Risks table has at least one entry with a mitigation.
- No `{{PLACEHOLDER}}` tokens remain.

### Category 3 — Epics

- Every epic has an overview, at least one user story, and Given/When/Then acceptance criteria.
- Every user story listed in the PRD maps to at least one epic.
- No `{{PLACEHOLDER}}` tokens remain.

### Category 4 — Standards

- Functional requirement IDs follow the `FR-NNN` format.
- Risk IDs follow the `R-NNN` format.
- Epic IDs follow the `EPIC-NNN` format.
- Story IDs are consistent between PRD and epics.

### Category 5 — Cross-document consistency

- Every epic referenced in the PRD exists as a file.
- Dependencies listed in the PRD are reflected in epics.
- Target users in the Brief match personas in user stories.

## Output format

After all five categories, the skill produces a final summary table:

| Category | Verdict | Critical | Warnings |
|----------|---------|----------|---------|
| Brief | ... | N | N |
| PRD | ... | N | N |
| Epics | ... | N | N |
| Standards | ... | N | N |
| Consistency | ... | N | N |

And a final recommendation:

- **Approved** — no critical gaps; hand off to tech-architect.
- **Revise** — warnings present; revision recommended before hand-off.
- **Blocked** — one or more critical gaps; must be resolved before proceeding.

## Evaluation criteria

- The skill must present findings one category at a time with an AskUserQuestion between categories.
- A missing mission statement in the Brief must always produce a Critical verdict.
- The skill must not approve a spec set that contains any `{{PLACEHOLDER}}` tokens.
- The skill must not suggest what to write — only identify gaps.
- The final recommendation must match the highest severity verdict across all categories.
