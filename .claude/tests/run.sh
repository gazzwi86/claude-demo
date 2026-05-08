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

echo "==> python tests under .claude/"
# Senior council fix: assert minimum test count so silent test loss fails loudly.
MIN_TEST_FILES=1
fail=0
found=0
total_tests=0
while IFS= read -r t; do
  [ -z "$t" ] && continue
  found=$((found + 1))
  echo "  -> $t"
  out=$(python3 "$t" -v 2>&1) || fail=$((fail + 1))
  echo "$out"
  # Count "Ran N tests" lines from unittest output
  n=$(echo "$out" | sed -n 's/^Ran \([0-9]*\) test.*/\1/p' | head -n1)
  total_tests=$(( total_tests + ${n:-0} ))
done < <(find .claude -maxdepth 4 -type f -name "*_test.py" 2>/dev/null | sort)

if [ $found -lt $MIN_TEST_FILES ]; then
  echo "FAIL: only $found test files found (expected >= $MIN_TEST_FILES) — silent test loss?" >&2
  exit 1
fi

# This repo has known test count = 35 in hooks_test.py + 18 for project-memory handlers.
EXPECTED_MIN_TOTAL=51
if [ "$total_tests" -lt "$EXPECTED_MIN_TOTAL" ]; then
  echo "FAIL: $total_tests tests ran (expected >= $EXPECTED_MIN_TOTAL) — silent test loss?" >&2
  exit 1
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
