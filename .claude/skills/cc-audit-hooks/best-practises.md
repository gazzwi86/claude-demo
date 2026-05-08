# Hooks audit best practices

See `${CLAUDE_PROJECT_DIR}/.claude/skills/cc-audit/templates/best-practises/hooks.md` for the canonical reference.

## Audit checklist

- [ ] All hooks route through `.claude/scripts/hooks.py` central dispatcher.
- [ ] Every command hook has an explicit `timeout`.
- [ ] No `type: prompt|agent|mcp_tool` hooks unless justified (expensive per fire).
- [ ] Exit codes follow conventions: `0` ok, `2` block, others non-blocking.
- [ ] Stdout JSON ≤10,000 chars.
- [ ] Per-hook timeouts within budget: 5s/1s/2s/45s for the canonical guards.

## Token cost estimate

For `type: prompt` hooks, estimate cost as:

```
chars / 4 * daily_fire_count
```

Daily fire count comes from transcript JSONL when available.
