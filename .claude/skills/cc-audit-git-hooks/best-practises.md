# Git-hooks audit best practices

## Audit checklist

- [ ] `.git/` present (else skip area).
- [ ] `core.hooksPath` set to `.claude/scripts/git-hooks`.
- [ ] `pre-commit` and `pre-push` scripts present and executable.
- [ ] `--no-verify` / `--no-gpg-sign` / `git commit -n` blocked via `guards/no-verify-deny.sh` PreToolUse hook.
- [ ] Husky collision handled (migrate or chain — never silent overwrite).

## Commands

```
git config core.hooksPath .claude/scripts/git-hooks
chmod +x .claude/scripts/git-hooks/{pre-commit,pre-push}
```

## Husky migration

If existing `.husky/pre-commit` runs e.g. `npx lint-staged`, fold that into `.claude/scripts/git-hooks/pre-commit` after the secret-scan step. Keep both behaviours.
