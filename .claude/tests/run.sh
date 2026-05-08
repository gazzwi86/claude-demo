#!/usr/bin/env bash
# Discover and run tests for .claude/ scaffolding.
#
# Convention:
#   - Python unit tests live in .claude/tests/ as `<name>_test.py`
#     (e.g. .claude/scripts/hooks.py is tested by .claude/tests/hooks_test.py).
#   - Skill / agent / command evals sit next to their .md as `<name>.eval.md`
#     and are listed but NOT executed automatically (they're prompts, not code).
#
# Run:    bash .claude/tests/run.sh
# CI use: same; non-zero exit on any failure.

set -uo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT"

echo "==> python sibling tests under .claude/"
fail=0
found=0
while IFS= read -r t; do
  [ -z "$t" ] && continue
  found=$((found + 1))
  echo "  -> $t"
  if ! python3 "$t" -v; then
    fail=$((fail + 1))
  fi
done < <(find .claude -maxdepth 4 -type f -name "*_test.py" 2>/dev/null | sort)

if [ $found -eq 0 ]; then
  echo "  (no *_test.py files found)"
fi

if [ $fail -gt 0 ]; then
  echo "FAIL: $fail test file(s) failed" >&2
  exit 1
fi

echo
echo "==> skill / command evals under .claude/ (listed only)"
eval_count=0
while IFS= read -r e; do
  [ -z "$e" ] && continue
  eval_count=$((eval_count + 1))
  echo "  -> $e"
done < <(find .claude -maxdepth 4 -type f -name "*.eval.md" 2>/dev/null | sort)

if [ $eval_count -eq 0 ]; then
  echo "  (none found — drop a <name>.eval.md next to a skill/command to add one)"
else
  echo "  (run with: claude -p \"\$(cat <evalfile>)\")"
fi

echo
echo "OK"
