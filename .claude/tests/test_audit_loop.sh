#!/usr/bin/env bash
# Integration test: mark-anatomy-stale → check-anatomy-fresh round trip.
#
# Proves that editing a tracked file writes a stale marker to its wiki page,
# that check-anatomy-fresh detects it (exits 1), and that removing the marker
# restores a clean state (exits 0).
#
# Strategy: snapshot the entire docs/wiki/ directory before the test and
# restore it on exit, so the test is fully isolated from any pre-existing
# stale markers.
#
# Run:    bash .claude/tests/test_audit_loop.sh
# CI use: same; non-zero exit on failure.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

WIKI_DIR="docs/wiki"
WIKI_FILE="${WIKI_DIR}/web-audio.md"
TEST_PATH="apps/web/lib/audio/engine.ts"
STALE_MARKER="<!-- stale: ${TEST_PATH} -->"

# Snapshot wiki dir so we can restore it unconditionally on exit.
SNAPSHOT_DIR=$(mktemp -d)

cleanup() {
  cp -r "${SNAPSHOT_DIR}/." "${WIKI_DIR}/"
  rm -rf "$SNAPSHOT_DIR"
}
trap cleanup EXIT

# Take snapshot (cp -r into empty dir)
cp -r "${WIKI_DIR}/." "${SNAPSHOT_DIR}/"

# Remove ALL pre-existing stale markers so check-anatomy-fresh starts clean.
python3 - <<'PYEOF'
import pathlib, re
wiki = pathlib.Path("docs/wiki")
for f in wiki.glob("*.md"):
    body = f.read_text(encoding="utf-8")
    cleaned = re.sub(r"\n<!-- stale: \S+ -->.*", "", body)
    f.write_text(cleaned, encoding="utf-8")
PYEOF

# Sanity: check-anatomy-fresh should be clean before we start
if ! python3 .claude/scripts/hooks.py check-anatomy-fresh 2>/dev/null; then
  echo "FAIL: precondition — wiki was not clean before test started" >&2
  exit 1
fi

# Step 1: simulate a PostToolUse edit to a tracked file
echo '{"tool_input":{"file_path":"'"$TEST_PATH"'"}}' \
  | python3 .claude/scripts/hooks.py post-tool-use mark-anatomy-stale

# Step 2: assert stale marker was written
if ! grep -qF "$STALE_MARKER" "$WIKI_FILE"; then
  echo "FAIL: stale marker not written to $WIKI_FILE" >&2
  exit 1
fi

# Step 3: check-anatomy-fresh must exit 1 (stale detected)
if python3 .claude/scripts/hooks.py check-anatomy-fresh 2>/dev/null; then
  echo "FAIL: check-anatomy-fresh should have exited 1 (stale wiki detected)" >&2
  exit 1
fi

# Step 4: clean up — remove the stale marker this test added
python3 - <<'PYEOF'
import pathlib, re
p = pathlib.Path("docs/wiki/web-audio.md")
body = p.read_text(encoding="utf-8")
cleaned = re.sub(r"\n<!-- stale: apps/web/lib/audio/engine\.ts -->.*", "", body)
p.write_text(cleaned, encoding="utf-8")
PYEOF

# Step 5: check-anatomy-fresh must exit 0 (clean after cleanup)
if ! python3 .claude/scripts/hooks.py check-anatomy-fresh 2>/dev/null; then
  echo "FAIL: check-anatomy-fresh should have exited 0 after cleanup" >&2
  exit 1
fi

echo "OK: audit loop round-trip passed"
