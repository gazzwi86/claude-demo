import tsParser from "@typescript-eslint/parser";
import security from "eslint-plugin-security";
import noUnsanitized from "eslint-plugin-no-unsanitized";

export default [
  {
    ignores: ["**/*.d.ts", "**/*.{test,spec}.{ts,tsx}"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parser: tsParser },
    plugins: {
      ...security.configs.recommended.plugins,
      "no-unsanitized": noUnsanitized,
    },
    rules: {
      ...security.configs.recommended.rules,
      "no-unsanitized/method": "error",
      "no-unsanitized/property": "error",
    },
  },
];
