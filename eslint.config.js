// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Angular-specific rules
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@angular-eslint/no-empty-lifecycle-method": "error",
      "@angular-eslint/no-input-rename": "error",
      "@angular-eslint/no-output-native": "error",
      "@angular-eslint/no-output-on-prefix": "error",
      "@angular-eslint/no-output-rename": "error",
      "@angular-eslint/prefer-on-push-component-change-detection": "warn",
      "@angular-eslint/use-injectable-provided-in": "error",
      "@angular-eslint/use-lifecycle-interface": "error",

      // TypeScript rules for better code quality
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
          overrides: {
            accessors: "explicit",
            constructors: "no-public",
            methods: "explicit",
            properties: "explicit",
            parameterProperties: "explicit"
          }
        }
      ],
      "@typescript-eslint/member-ordering": [
        "error",
        {
          default: [
            "static-field",
            "instance-field",
            "static-method",
            "instance-method"
          ]
        }
      ],
      "@typescript-eslint/no-inferrable-types": "off",

      // General ESLint rules
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Template rules for better performance
      "@angular-eslint/template/no-call-expression": "warn",
      "@angular-eslint/template/use-track-by-function": "error",
      "@angular-eslint/template/no-any": "warn",
      "@angular-eslint/template/cyclomatic-complexity": ["error", { "maxComplexity": 5 }],
    },
  }
);
