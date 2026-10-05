<!--
This brief must be self-contained. The implementing agent reads only this file.
All context needed to implement, test, and verify this task must be present here.
Do not reference other task files as required reading — cross-reference ADRs for decisions only.
-->

# Task: {{TASK_TITLE}}

**Task ID:** {{TASK_ID}}
**Epic:** {{EPIC_ID}} — {{EPIC_TITLE}}
**Status:** {{STATUS}}

## User Story

{{USER_STORY}}

## Acceptance Criteria

```gherkin
Given {{PRECONDITION}}
When {{ACTION}}
Then {{OUTCOME}}
```

## Pseudocode

```
{{PSEUDOCODE}}
```

## API Contracts

```yaml
{{API_CONTRACT}}
```

## Diagram References

- **C4 Container:** `docs/architecture/c4-container.md` — {{RELEVANT_COMPONENT}}
- **Data model:** `docs/architecture/data-model.md` — {{RELEVANT_ENTITY}}

## Design Decisions

- **{{DECISION_TOPIC}}** — see `docs/architecture/decisions/ADR-{{ADR_NUMBER}}.md`

## Definition of Ready Checklist

- [ ] User story follows As a / I want / So that format
- [ ] Acceptance criteria are in Given/When/Then format
- [ ] Pseudocode covers the happy path and at least one error path
- [ ] API contracts defined for all new or modified endpoints
- [ ] Diagram references point to existing files
- [ ] All ADR references resolve to existing ADR files
- [ ] Test requirements section is complete

## Definition of Done Checklist

- [ ] All acceptance criteria pass
- [ ] Unit tests cover named scenarios (see Test Requirements)
- [ ] Integration tests pass
- [ ] Code review approved
- [ ] No `{{PLACEHOLDER}}` tokens remain in any file touched by this task

## Test Requirements

### Named scenarios

| Scenario | Type | Maps to AC |
|----------|------|-----------|
| {{SCENARIO_NAME}} | {{TEST_TYPE}} | {{AC_REFERENCE}} |

### Type counts

- Unit tests: {{UNIT_COUNT}}
- Integration tests: {{INTEGRATION_COUNT}}
- E2E tests: {{E2E_COUNT}}

## Implementation Hints

{{IMPLEMENTATION_HINTS}}
