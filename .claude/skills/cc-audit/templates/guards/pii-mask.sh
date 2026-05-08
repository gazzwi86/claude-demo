#!/usr/bin/env bash
# pii-mask.sh — masks PII (emails, phones, SSNs, credit cards, AWS keys, GitHub PATs, JWTs, private keys).
# Reads transcript text on stdin (or via payload.transcript_path); prints masked text. Non-blocking. <50ms target.
set -u

INPUT="$(cat 2>/dev/null || true)"

# If input is a JSON payload with transcript_path, read that file. Otherwise treat input as raw text.
TEXT="$INPUT"
if printf '%s' "$INPUT" | head -c1 | grep -q '{'; then
  TP="$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try: print((json.loads(sys.stdin.read()) or {}).get('transcript_path', ''))
except: print('')
" 2>/dev/null)"
  if [ -n "$TP" ] && [ -f "$TP" ]; then
    TEXT="$(tail -c 32768 "$TP" 2>/dev/null || true)"
  fi
fi

[ -z "$TEXT" ] && exit 0

printf '%s' "$TEXT" | python3 - <<'PY'
import re, sys
text = sys.stdin.read()
def luhn(n):
    s = 0
    for i, d in enumerate(reversed(n)):
        d = int(d)
        if i % 2 == 1:
            d *= 2
            if d > 9: d -= 9
        s += d
    return s % 10 == 0
patterns = [
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"), "[EMAIL]"),
    (re.compile(r"\b\+?[0-9]{1,3}[-. ]?\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}\b"), "[PHONE]"),
    (re.compile(r"\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b"), "[SSN]"),
    (re.compile(r"AKIA[0-9A-Z]{16}"), "[AWS-KEY]"),
    (re.compile(r"gh[pousr]_[A-Za-z0-9_]{36,255}"), "[GH-PAT]"),
    (re.compile(r"eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"), "[JWT]"),
    (re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC )?PRIVATE KEY-----"), "[PRIVATE-KEY]"),
]
for rx, repl in patterns:
    text = rx.sub(repl, text)
def cc_repl(m):
    digits = re.sub(r"\D", "", m.group(0))
    return "[CC]" if 13 <= len(digits) <= 19 and luhn(digits) else m.group(0)
text = re.sub(r"\b(?:\d[ -]?){13,19}\b", cc_repl, text)
sys.stdout.write(text)
PY
exit 0
