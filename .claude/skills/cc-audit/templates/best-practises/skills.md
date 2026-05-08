# Skills best practices

## Frontmatter

Required:
- `name` — ≤64 chars, lowercase + hyphen.
- `description` — ≤1024 chars, **third person**, "what + when".

Optional:
- `when_to_use` — explicit trigger phrases.
- `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `effort`, `context: fork`, `agent`, `hooks`, `paths`, `shell`.

## Body

- ≤500 lines.
- Third person throughout. "The skill inspects X" not "I inspect X" or "you inspect X".
- Reference supporting files **one level deep**. Don't make Claude follow a file → file → file chain.

## Description-as-trigger

Be specific. Include key terms a user would type. The description is what the model uses to decide whether to invoke the skill.

## Common mistakes

- Weak descriptions ("Helps with X").
- Oversize bodies — paste reference docs into a sibling file and link, don't inline.
- Second-person voice ("you should...").
- Deeply-nested file refs.
- Ambiguous trigger conditions.

## Decomposition

One focus area per skill. If you're tempted to add a second concern, split it. Subskills compose — bloated megaskills don't.

## Gotchas section

Each skill should have a "Gotchas" section listing known failure modes and how the skill avoids them. Reviewers (and future-you) will thank you.
