// Complexity / maintainability gate for apps/web.
//
// Two complementary rules:
//   * `complexity` (built-in)         — cyclomatic complexity, max 10.
//   * `sonarjs/cognitive-complexity`  — cognitive complexity, max 15.
//
// Cognitive complexity is the better signal of "hard to understand"; the
// built-in cyclomatic rule catches the simpler "too many branches" case.
// Both run in pre-commit only (.claude/scripts/git-hooks/pre-commit) so
// edits aren't gated mid-flight.
//
// Thresholds picked from current SonarQube defaults (cog 15) and the
// commonly-cited "stop and refactor" cyclomatic threshold of 10.
//
// Tests, snapshots, and type declarations are exempt — complexity gates
// signal *production* code that needs untangling, not test scaffolding.

import tsParser from "@typescript-eslint/parser";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  {
    ignores: [
      "**/*.d.ts",
      "**/*.{test,spec}.{ts,tsx}",
      "e2e/**",
      ".next/**",
      "node_modules/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parser: tsParser },
    plugins: { sonarjs },
    rules: {
      complexity: ["error", { max: 10 }],
      "sonarjs/cognitive-complexity": ["error", 15],
    },
  },
];
