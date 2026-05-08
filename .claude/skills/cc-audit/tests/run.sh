#!/usr/bin/env bash
# tests/run.sh — fixture-based TDD harness for cc-audit and all cc-audit-<area> skills.
# For each skill, iterate tests/fixtures/<case>/ and diff inspect.py output to expected/<case>.json.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$(cd "$ROOT/.." && pwd)"

PASS=0
FAIL=0
SKIP=0

run_skill_tests() {
  local skill_dir="$1"
  local skill_name="$(basename "$skill_dir")"
  local fixtures="$skill_dir/tests/fixtures"
  local expected="$skill_dir/tests/expected"
  local inspect="$skill_dir/inspect.py"

  if [ ! -f "$inspect" ]; then
    SKIP=$((SKIP + 1))
    return
  fi
  if [ ! -d "$fixtures" ]; then
    return
  fi

  for fx in "$fixtures"/*/; do
    [ -d "$fx" ] || continue
    local case_name="$(basename "$fx")"
    local exp="$expected/${case_name}.json"
    if [ ! -f "$exp" ]; then
      printf '  SKIP %s::%s (no expected)\n' "$skill_name" "$case_name"
      SKIP=$((SKIP + 1))
      continue
    fi

    local actual
    actual="$(python3 "$inspect" "$fx" --json 2>/dev/null || echo '{}')"

    if python3 - "$actual" "$exp" <<'PY' >/dev/null 2>&1
import json, sys
a = json.loads(sys.argv[1])
e = json.load(open(sys.argv[2]))
def norm(x):
    if isinstance(x, dict):
        return {k: norm(v) for k, v in sorted(x.items()) if k not in ("evidence",)}
    if isinstance(x, list):
        return [norm(v) for v in x]
    return x
sys.exit(0 if norm(a) == norm(e) else 1)
PY
    then
      printf '  PASS %s::%s\n' "$skill_name" "$case_name"
      PASS=$((PASS + 1))
    else
      printf '  FAIL %s::%s\n' "$skill_name" "$case_name"
      FAIL=$((FAIL + 1))
    fi
  done
}

printf 'cc-audit test harness\n\n'

for d in "$SKILLS_DIR"/cc-audit "$SKILLS_DIR"/cc-audit-*; do
  [ -d "$d" ] || continue
  printf 'skill: %s\n' "$(basename "$d")"
  run_skill_tests "$d"
done

printf '\nresult: %d pass, %d fail, %d skip\n' "$PASS" "$FAIL" "$SKIP"
[ "$FAIL" -eq 0 ]
