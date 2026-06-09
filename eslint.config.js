// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import simpleImportSort from "eslint-plugin-simple-import-sort";

// ESLint takes priority; Prettier (eslint-config-prettier) disables ESLint formatting rules.
// Base: typescript-eslint strict-type-checked. Formatting is handled by Prettier (format-on-save).
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/*.wgsl"
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      jsdoc,
      "simple-import-sort": simpleImportSort
    },
    rules: {
      // Naming conventions (variables snake_case, functions camelCase, types PascalCase, ...)
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "variable", format: ["snake_case", "UPPER_CASE"], leadingUnderscore: "allow" },
        { selector: "variable", modifiers: ["const"], types: ["function"], format: ["camelCase"] },
        { selector: "function", format: ["camelCase"] },
        { selector: "parameter", format: ["snake_case"], leadingUnderscore: "allow" },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["UPPER_CASE"] },
        // Object properties are free (external API keys, etc. handled per-site)
        { selector: "property", format: null }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      // JSDoc required for all functions (params/returns required where applicable)
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true
          }
        }
      ],
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": "error",
      eqeqeq: "error",
      "prefer-const": "error"
    }
  },
  // Must be last: turn off all formatting rules that conflict with Prettier
  prettier
);
