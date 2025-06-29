module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Add any custom rules here if needed
  rules: {
    // Ensure the commit type is never empty
    'type-empty': [2, 'never'],
    // Ensure the commit subject is never empty
    'subject-empty': [2, 'never'],
    // Example of a custom rule for scope enumeration (uncomment and modify if needed)
    // 'scope-enum': [
    //   2,
    //   'always',
    //   ['api', 'ui', 'docs', 'build', 'release', 'deps', 'config']
    // ],
  },
};
