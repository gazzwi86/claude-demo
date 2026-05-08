# Permissions best practices

## Precedence (highest → lowest)

1. Managed settings (cannot be overridden).
2. CLI args.
3. `.claude/settings.local.json` (gitignored, personal).
4. `.claude/settings.json` (project, committed).
5. `~/.claude/settings.json` (user-level).

Arrays concatenate + dedupe across scopes; objects deep-merge; scalars override.

## allow / ask / deny

- `allow` — auto-approved.
- `ask` — prompt user.
- `deny` — refused. **Deny wins over allow at all scopes.**

## Defense-in-depth

Some clients have `permissions.deny` enforcement gaps. Back deny rules with a PreToolUse hook that exits 2 on the same patterns.

## Default mode

`defaultMode` ∈ `{default, acceptEdits, plan, auto, dontAsk, bypassPermissions}`.

## Self-modification guards

Always deny:
- `Edit(./.claude/settings.json)` and `Write(./.claude/settings.json)`
- `Edit(./.claude/scripts/hooks.py)` and `Write(./.claude/scripts/hooks.py)`

Otherwise a prompt-injected agent can rewrite the rules that constrain it. The bootstrap script (run from outside the agent) handles updates.

## Bash matcher subtleties

- `Bash(rm -rf *)` matches `rm -rf foo` but NOT `rm -rf` alone — add `Bash(rm -rf)` if you want both.
- `Bash(curl*)` matches `curl ...`, `curlie`, `curl-config`. Use `Bash(curl *)` for word-boundary if needed.
- Pipes: `Bash(curl * | sh)` matches the curl|sh pattern specifically.

## Seeded allow per stack

| Stack | Allow seeds |
|---|---|
| Always | `Bash(git status)`, `Bash(git diff *)`, `Bash(ls *)`, `Bash(grep *)`, `Bash(rg *)`, `Read`, `Edit`, `Write` |
| Node | `Bash(npm run *)`, `Bash(npm test *)`, `Bash(pnpm *)`, `Bash(yarn *)` |
| Python | `Bash(pytest *)`, `Bash(uv *)`, `Bash(ruff *)`, `Bash(python -m *)` |
| Go | `Bash(go test *)`, `Bash(go build *)` |
| Rust | `Bash(cargo *)` |

## Transcript-mining helper

After a few sessions, mine the transcript for repeated `ask` prompts the user always approves; promote to `allow`.
