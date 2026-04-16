#!/usr/bin/env node

/**
 * Pre-tool hook: scans a file for potential hardcoded secrets.
 * Used as a PreToolUse hook for Edit/Write operations.
 *
 * Exit 0 = allow, Exit 2 = block with message
 */

const fs = require("node:fs");

const filePath = process.argv[2];

if (!filePath || !fs.existsSync(filePath)) {
  // File doesn't exist yet (new file being created) — allow
  process.exit(0);
}

const content = fs.readFileSync(filePath, "utf-8");

const SECRET_PATTERNS = [
  /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}["']/gi,
  /sk-[a-zA-Z0-9]{20,}/g,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
];

const matches = SECRET_PATTERNS.flatMap((pattern) => {
  const found = content.match(pattern) || [];
  return found.map((m) => m.substring(0, 40) + "...");
});

if (matches.length > 0) {
  console.error(JSON.stringify({
    decision: "block",
    reason: `Potential secret detected in ${filePath}: ${matches[0]}`
  }));
  process.exit(2);
}

process.exit(0);
