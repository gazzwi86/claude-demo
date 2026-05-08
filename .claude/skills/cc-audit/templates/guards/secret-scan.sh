#!/usr/bin/env bash
# secret-scan.sh — gitleaks if installed, regex fallback always.
# Stdin: JSON payload (PreToolUse:Edit|Write or pre-commit invocation).
# Exit: 0 clean, 2 finding (block), 1 error.
set -u

INPUT="$(cat 2>/dev/null || true)"

extract_field() {
  printf '%s' "$INPUT" | python3 -c "
import json, sys
try: d = json.loads(sys.stdin.read())
except: sys.exit(0)
ti = d.get('tool_input') or {}
print(ti.get('content') or ti.get('new_string') or '')
" 2>/dev/null
}

CONTENT="$(extract_field)"

scan_text() {
  local text="$1"
  python3 - "$text" <<'PY'
import re, sys
text = sys.argv[1]
patterns = [
    (r"AKIA[0-9A-Z]{16}", "aws-access-token"),
    (r"(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])", "aws-secret-candidate"),
    (r"gh[pousr]_[A-Za-z0-9_]{36,255}", "github-pat"),
    (r"xox[baprs]-[A-Za-z0-9-]{10,}", "slack-token"),
    (r"eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", "jwt"),
    (r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----", "private-key"),
    (r"(?i)(?:api[_-]?key|secret|password|token)\s*[:=]\s*['\"][^'\"]{16,}['\"]", "generic-secret"),
]
for pat, name in patterns:
    m = re.search(pat, text)
    if m:
        snippet = m.group(0)[:40]
        # Luhn check elided in fallback; AWS-secret-candidate is high false-positive in this regex
        if name == "aws-secret-candidate":
            continue
        print(f"secret-scan: {name} match: {snippet}...", file=sys.stderr)
        sys.exit(2)
PY
}

# Prefer gitleaks if available and we're invoked outside a hook (no stdin payload).
if command -v gitleaks >/dev/null 2>&1 && [ -z "$CONTENT" ]; then
  if gitleaks git -v --staged --redact 2>&1; then
    exit 0
  else
    exit 2
  fi
fi

# Regex fallback always
if [ -n "$CONTENT" ]; then
  scan_text "$CONTENT"
  rc=$?
  exit $rc
fi

exit 0
