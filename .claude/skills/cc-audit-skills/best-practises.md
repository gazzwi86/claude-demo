# Skills audit best practices

See `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/best-practises/skills.md` for the canonical reference.

## Audit checklist

- [ ] `name` matches `^[a-z][a-z0-9-]{0,63}$`.
- [ ] `description` present, ≤1024 chars, third-person.
- [ ] Description has specific trigger phrases (≥8 words).
- [ ] Body ≤500 lines.
- [ ] Third-person voice throughout body.
- [ ] File references one level deep max.

## Frontmatter shape (reference)

```yaml
---
name: my-skill
description: Specific third-person summary including trigger phrases users would type. Use when X, Y, or Z.
when_to_use: Concrete trigger conditions.
argument-hint: "[--flag]"
allowed-tools: ["Read", "Glob"]
---
```

## Common mistakes

- "Helps with X" — too weak, model can't decide.
- "I will do X" — second-person voice.
- 800-line body — split or link a sibling reference.
