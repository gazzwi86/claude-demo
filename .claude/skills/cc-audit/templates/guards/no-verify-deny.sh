#!/usr/bin/env bash
# no-verify-deny.sh — block --no-verify, --no-gpg-sign, and `git commit -n`.
# Stdin: PreToolUse:Bash payload.
set -u

INPUT="$(cat 2>/dev/null || true)"

CMD="$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try: d = json.loads(sys.stdin.read()) or {}
except: d = {}
print((d.get('tool_input') or {}).get('command', ''))
" 2>/dev/null)"

[ -z "$CMD" ] && exit 0

if printf '%s' "$CMD" | grep -qE -- '--no-verify\b|--no-gpg-sign\b'; then
  printf 'no-verify-deny: refusing to bypass git hooks: %s\n' "${CMD:0:120}" >&2
  exit 2
fi

if printf '%s' "$CMD" | grep -qE '\bgit\b.*\bcommit\b' && \
   printf '%s' "$CMD" | grep -qE '(\s|^)-n(\s|$)'; then
  printf 'no-verify-deny: `git commit -n` bypasses hooks: %s\n' "${CMD:0:120}" >&2
  exit 2
fi

exit 0
