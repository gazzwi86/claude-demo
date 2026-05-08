#!/usr/bin/env bash
# iac-deny.sh — IaC plan-before-apply enforcement.
# Stdin: PreToolUse:Bash payload. Touches .iac-plan-marker on plan/preview commands;
# rejects apply/deploy/up if marker is missing or older than 10 min.
set -u

INPUT="$(cat 2>/dev/null || true)"
ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
MARKER="$ROOT/.claude/logs/.iac-plan-marker"
mkdir -p "$(dirname "$MARKER")"

CMD="$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try: d = json.loads(sys.stdin.read()) or {}
except: d = {}
print((d.get('tool_input') or {}).get('command', ''))
" 2>/dev/null)"

[ -z "$CMD" ] && exit 0

is_plan() {
  case "$CMD" in
    *"terraform plan"*|*"terraform validate"*|*"cdk diff"*|*"pulumi preview"*) return 0 ;;
    *) return 1 ;;
  esac
}

is_apply() {
  case "$CMD" in
    *"terraform apply"*|*"cdk deploy"*|*"pulumi up"*) return 0 ;;
    *) return 1 ;;
  esac
}

if is_plan; then
  touch "$MARKER"
  exit 0
fi

if is_apply; then
  if [ ! -f "$MARKER" ]; then
    printf 'iac-deny: no plan marker. run `terraform plan` (or cdk diff / pulumi preview) first.\n' >&2
    exit 2
  fi
  age=$(( $(date +%s) - $(stat -f %m "$MARKER" 2>/dev/null || stat -c %Y "$MARKER" 2>/dev/null || echo 0) ))
  if [ "$age" -gt 600 ]; then
    printf 'iac-deny: plan marker is %ds old (>600). re-plan before apply.\n' "$age" >&2
    exit 2
  fi
fi

exit 0
