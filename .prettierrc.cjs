/** @type {import("prettier").Config} */
module.exports = {
  arrowParens: "always",
  printWidth: 80,
  singleQuote: false,
  jsxSingleQuote: false,
  semi: true,
  trailingComma: "all",
  tabWidth: 2,
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
  ],
  importOrder: [
    "^(jest-fetch-mock)$",
    "<THIRD_PARTY_MODULES>",
    "^@drupal-kit/(.*)$",
    "",
    "^~/utils/(.*)$",
    "^~/(.*)$",
    "^[./]",
  ],
  importOrderParserPlugins: ["decorators-legacy", "importAssertions", "typescript"],
};


