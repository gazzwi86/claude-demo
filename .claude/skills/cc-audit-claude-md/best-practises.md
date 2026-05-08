# CLAUDE.md audit best practices

See `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/best-practises/claude-md.md` for the canonical reference.

## Audit checklist

- [ ] Top-level CLAUDE.md ≤100 lines.
- [ ] Per-folder CLAUDE.md ≤200 lines.
- [ ] All `.claude/rules/*.md` have `paths:` frontmatter.
- [ ] No verifiable rules (complexity, test-must-pass, no-console-log) sitting in CLAUDE.md when they could be hooks.
- [ ] Top-level functions as navigation index, not as a rules dump.

## Bloated handling

When over budget:
1. Heading-based cluster (deterministic).
2. Per-cluster: extract to `.claude/rules/<topic>.md` with `paths:` glob.
3. Folder-mention clusters: extract to `apps/<area>/CLAUDE.md`.
4. Replace original sections with navigation links.
5. Backup pre-change to `.claude/backup-<ts>/`.

## Lift-to-hook examples

```jsonc
// PostToolUse:Edit — eslint complexity rule
{
  "matcher": "Edit|Write",
  "hooks": [{
    "type": "command",
    "command": "eslint --rule '{\"complexity\":[\"error\",10]}' \"$(cat | jq -r '.tool_input.file_path')\"",
    "timeout": 5000
  }]
}
```
