module.exports = {
  env: {
    es2022: true, // Enables modern ECMAScript features
    node: true, // Enables Node.js global variables and Node.js scoping.
    jest: true, // Enables Jest global variables.
  },
  extends: [
    'eslint:recommended', // Uses the recommended rules from ESLint
    'plugin:jest/recommended', // Uses the recommended rules from eslint-plugin-jest
    'prettier', // Turns off all rules that are unnecessary or might conflict with Prettier.
  ],
  parserOptions: {
    ecmaVersion: 2023, // Use a specific, recent ECMAScript version for modern syntax like import assertions
    sourceType: 'script', // Use 'script' for CommonJS modules
  },
  rules: {
    // For a CLI tool, console logs are expected and intentional for user feedback.
    'no-console': 'off',
  },
};
