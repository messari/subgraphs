const path = require("path");
const rulesDirPlugin = require("eslint-plugin-rulesdir");

rulesDirPlugin.RULES_DIR = [path.join(__dirname, "_eslint-rules")];

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    // Using the recommended typescript configurations
    "plugin:@typescript-eslint/recommended",
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",

    // Prettier - last to override all other formatting rules
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "rulesdir"],
  ignorePatterns: ["**/build", "**/generated"],
  rules: {
    // Give the power to the people! We decided to leave this decision up to the dev.
    "@typescript-eslint/no-inferrable-types": "off",

    // We utilize namespaces and this change seems to be a matter of preference. Off for now.
    "@typescript-eslint/no-namespace": "off",

    // We want to make sure to correct for this. It can be difficult to debug when errors arise from this assertion.
    "@typescript-eslint/no-non-null-assertion": "off",

    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          // un-ban BigInt - It must be getting confused with the native bigInt type
          BigInt: false,
        },
        extendDefaults: true,
      },
    ],

    // disallow magic numbers: https://eslint.org/docs/latest/rules/no-magic-numbers
    "@typescript-eslint/no-magic-numbers": "error",

    // Enforce for cleanliness
    "@typescript-eslint/no-unused-vars": "error",

    // enforce camelCase naming
    // https://eslint.org/docs/latest/rules/camelcase
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "default",
        format: ["camelCase", "UPPER_CASE"],
        leadingUnderscore: "allow",
      },
      {
        selector: "variable",
        modifiers: ["const", "global"],
        format: ["UPPER_CASE"],
      },
      {
        selector: "function",
        format: ["camelCase"],
        leadingUnderscore: "allow",
      },
      {
        selector: "typeLike",
        format: ["PascalCase"],
      },
    ],

    // CUSTOM RULES, find them in subgraphs/_eslint-rules
    // -----------------------------------------------

    // encourage address literals to be all lowercase to comparison errors when using strings.
    "rulesdir/no-checksum-addresses": "error",
    // disallow usage of string literals.
    "rulesdir/no-string-literals": "error",
    // disallow non-standard folder and file names (i.e., not snake_case or kebab-case).
    "rulesdir/no-non-standard-filenames": "error",
  },
};
