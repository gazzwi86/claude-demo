# Spec Evaluation Scenarios

Evaluation scenarios for the elicit + spec-writer + spec-review skill chain and the
product-owner and tech-architect agents.

---

## Scenario A — Trigger test

**Purpose:** Verify natural-language phrases correctly invoke the elicit skill.

**Trigger phrases (any should invoke elicit):**

- "I'm not sure what to build"
- "Help me explore requirements for a new feature"
- "Clarify the scope of this project"
- "I need to narrow down the problem space"
- "What should I build first?"

**Expected behaviour:** The elicit skill activates and presents an AskUserQuestion
MCQ asking what the user is trying to figure out. No spec writing begins until
elicitation is complete.

**Pass criteria:**

- AskUserQuestion is the first action taken (no document writes before this)
- MCQ contains at least three options
- No code or architecture suggestions are made during elicitation

**Fail criteria:**

- Skill proceeds directly to writing a spec without asking any questions
- MCQ has fewer than three options
- Skill suggests a technical solution before the problem is defined

---

## Scenario B — HITL test

**Purpose:** Verify spec-writer presents one section at a time, not a full document.

**Trigger:** User invokes spec-writer with a complete problem statement.

**Expected behaviour:** The skill writes the Mission Statement section of the Brief,
presents it, and asks "Approve / Amend / Reject?" before writing the Problem section.
This pattern repeats for every section.

**Pass criteria:**

- No more than one section is written before an AskUserQuestion appears
- AskUserQuestion offers Approve, Amend, and Reject options
- Amend causes the section to be rewritten (not skipped)
- Reject triggers a clarifying question before a rewrite

**Fail criteria:**

- Skill writes the entire Brief in one pass without pausing
- Skill proceeds to the PRD before every Brief section is approved
- Amend is accepted but the section is not updated

---

## Scenario C — Gate test

**Purpose:** Verify spec-review blocks with Critical if the Brief is missing its mission statement.

**Setup:** `docs/specs/brief.md` exists but Mission Statement is empty or contains `{{PLACEHOLDER}}`.

**Expected behaviour:** spec-review reports Category 1 (Brief) as Critical with a finding
that the mission statement is missing or contains a placeholder. Final recommendation: Blocked.

**Pass criteria:**

- Category 1 verdict is Critical
- Finding explicitly names "mission statement" as the gap
- Final recommendation is Blocked (not Revise, not Approved)
- Skill does not advance to tech-architect hand-off

**Fail criteria:**

- Skill reports Warning instead of Critical for missing mission statement
- Skill approves the spec set despite the placeholder
- Skill proceeds to tech-architect hand-off

---

## Scenario D — Composition test

**Purpose:** Verify product-owner agent calls elicit then spec-writer, not bypassing them.

**Trigger:** User asks the product-owner agent to "write a spec for a music looping app".

**Expected behaviour:** Agent invokes the elicit skill first. Only after elicitation
produces a decision summary does the agent invoke spec-writer. The agent does not write
any spec sections directly — it delegates entirely to the skills.

**Pass criteria:**

- Elicit skill is invoked before any spec document is written
- Spec-writer skill is invoked using the elicited decision summary as input
- Agent does not write spec content directly (all writes go through spec-writer)
- Agent invokes spec-review after spec-writer completes

**Fail criteria:**

- Agent writes a Brief section without invoking the elicit skill first
- Agent bypasses spec-writer and writes documents directly
- Agent skips spec-review before handing off to tech-architect

---

## Scenario E — Boundary test

**Purpose:** Verify product-owner agent defers architectural decisions to tech-architect.

**Trigger:** During elicitation the user asks "Should we use PostgreSQL or DynamoDB?"

**Expected behaviour:** The product-owner agent records the question as an open
architectural decision in the Brief under "Key Decisions" and explicitly defers to
the tech-architect agent. It does not express a preference.

**Pass criteria:**

- Agent records the question as an open decision in the Brief
- Agent explicitly defers to the tech-architect agent for resolution
- Agent does not name a preferred technology
- Agent does not write any architecture documents

**Fail criteria:**

- Agent recommends a technology ("Use DynamoDB because…")
- Agent skips recording the open decision
- Agent writes an ADR or architecture diagram
