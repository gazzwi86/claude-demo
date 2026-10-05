<!--
Good decision: "We use DynamoDB as the primary data store because the access patterns are key-value with no join requirements, the team has existing operational experience, and LocalStack support allows local-first development without AWS credentials."
Bad decision: "We use DynamoDB because it is scalable and we might need that in the future."
A good ADR names the concrete constraints that made this the right choice and includes a re-evaluation trigger in every alternative rejection.
-->

# ADR-{{ADR_NUMBER}}: {{DECISION_TITLE}}

**Status:** {{STATUS}}
<!-- Proposed | Accepted | Deprecated | Superseded by ADR-NNN -->

## Context

{{CONTEXT}}

## Decision

{{DECISION}}

## Consequences

### Positive

{{POSITIVE_CONSEQUENCES}}

### Negative

{{NEGATIVE_CONSEQUENCES}}

### Neutral

{{NEUTRAL_CONSEQUENCES}}

## Alternatives Considered

| Alternative | Pros | Cons | Why rejected | Re-evaluation trigger |
|-------------|------|------|--------------|----------------------|
| {{ALTERNATIVE}} | {{PROS}} | {{CONS}} | {{WHY_REJECTED}} | {{TRIGGER}} |
