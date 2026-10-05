---
name: elicit
description: Structured requirements elicitation via MCQ-based dialogue. Invoke when the user says "explore requirements", "clarify scope", "narrow the problem space", "I'm not sure what to build", "help me think through this", or "what should I build".
---

# Elicit

The elicit skill guides a user from a vague idea to a sharply-defined problem statement
using structured dialogue methods. It never writes code or architecture — it produces
a captured decision record that feeds into spec-writer or other downstream skills.

## Step 1 — Initialise

If no arguments are provided, the skill asks via AskUserQuestion:

> "What are you trying to figure out? Pick the closest match:"
>
> a. I have a rough idea but don't know what to build yet
> b. I have competing requirements that conflict with each other
> c. I know the goal but there are multiple approaches and I'm unsure which to take
> d. I need to understand the root cause of a problem before defining a solution

The answer seeds method selection in Step 2.

## Step 2 — Detect method

The skill selects the best method from context clues or the Step 1 answer:

- **Unclear root cause** — Five Whys (see `methods/five-whys.md`)
- **Broad or unbounded scope** — Twenty Questions (see `methods/twenty-questions.md`)
- **Conflicting requirements** — Six Hats (inline, see Step 3)
- **Multiple competing approaches** — Stochastic Reasoning (inline, see Step 3)
- **General exploration** — MCQ rounds (default)

## Step 3 — Run the selected method

### MCQ rounds (default)

The skill generates four candidate framings as a multiple-choice question, iterating
until the user selects one or asks to stop. Each round narrows by one dimension
(who, what, why, constraint).

### Five Whys

The skill runs the method defined in `methods/five-whys.md`. Each iteration presents
3–4 plausible "why" answers as MCQ. The chain terminates at a root cause or after
five iterations.

### Twenty Questions

The skill runs the method defined in `methods/twenty-questions.md`. It tracks the
remaining question budget and presents four binary questions per AskUserQuestion round.

### Six Hats (inline)

The skill surfaces one hat at a time — White (facts), Black (risks), Yellow (benefits),
Green (creative alternatives), Red (intuition/emotion), Blue (process/summary) — and
asks the user to respond from that perspective. Conflicting requirements are mapped
to the hat where the conflict first appears.

### Stochastic Reasoning (inline)

The skill presents three competing approaches as labelled options, asks the user to
score each on two axes (confidence, impact), then surfaces the expected-value winner
with a brief rationale. A second round asks whether the winner changes under a stated
constraint.

## Step 4 — Capture output

On completion the skill produces a structured decision summary:

```
Method used: <method>
Problem statement: <one sentence>
Root cause / scope boundary / winning approach: <one sentence>
Key constraints: <bullet list>
Open questions: <bullet list>
```

If called from within the product-owner agent, the skill folds this summary into
the agent's working context. If called standalone, the skill offers to write the
summary to `docs/specs/decisions-<slug>.md`.

## Evaluation criteria

- The skill must not proceed to a method without a clear problem statement from the user.
- MCQ answers must contain at least three options and at most five.
- Five Whys must not exceed five iterations without surfacing a root cause or surfacing ambiguity explicitly.
- Twenty Questions must display the remaining question budget on every round.
- The final output must include a one-sentence problem statement.
- The skill must not make design decisions or suggest solutions — only clarify the problem space.
