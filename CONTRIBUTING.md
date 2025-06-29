# Contributing to aidoccli

We welcome contributions to the `aidoccli` project! By contributing, you help improve this foundation for JavaScript and TypeScript documentation generation automatically.

Please take a moment to review this document to understand our contribution guidelines.

## Table of Contents

- Code of Conduct
- How to Contribute
  - Reporting Bugs
  - Suggesting Enhancements
  - Your First Code Contribution
  - Pull Request Guidelines
- Development Setup
- Code Style
- Testing
- Commit Messages
- License

## Code of Conduct

This project and everyone participating in it is governed by the aidoccli Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to <shytiger@yahoo.com>.

## How to Contribute

### Reporting Bugs

If you find a bug in the template or its configurations, please open an issue using the Bug Report template.

Before opening a new bug report, please check if a similar issue already exists. When reporting, provide:

- A clear and concise description of the bug.
- Steps to reproduce the behavior.
- Expected behavior.
- Screenshots or code snippets if applicable.
- Any additional context (e.g., Node.js version, OS).

### Suggesting Enhancements

We're always looking for ways to improve this template! If you have an idea for a new feature or an improvement, please open an issue.

Describe the enhancement, why it would be useful, and provide any relevant examples or mockups.

### Your First Code Contribution

If you're new to contributing to open source or this project, here's a general workflow:

1. **Fork** this repository to your own GitHub account.
2. **Clone** your forked repository to your local machine:

   ```bash
   git clone https://github.com/your-username/aidoccli.git # Replace with your username
   cd aidoccli
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Create a new branch** for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   # or bugfix/your-bug-fix-name
   ```

5. Make your changes.
6. **Test** your changes (see Testing).
7. **Commit** your changes (see Commit Messages).
8. **Push** your branch to your forked repository:

   ```bash
   git push origin feature/your-feature-name
   ```

9. Open a **Pull Request** to the `main` branch of the original `aidoccli` repository.

### Pull Request Guidelines

When submitting a pull request, please ensure:

- You have read and followed the Pull Request Template.
- Your branch is up-to-date with the `main` branch of this repository.
- Your code adheres to the project's Code Style.
- All existing tests pass, and new tests are added for new features or bug fixes.
- Your commit messages are clear and follow the Commit Messages guidelines.
- The PR description clearly explains the problem your PR solves and how it solves it.

## Development Setup

After cloning the repository and running `npm install`, the pre-commit hooks (managed by Husky and lint-staged) will be automatically set up. This ensures that your code is linted and formatted before every commit.

## Code Style

This project enforces code style using ESLint and Prettier.

- `npm run lint`: Checks for linting errors.
- `npm run lint:fix`: Automatically fixes fixable linting errors.
- `npm run lint:md:fix`: Automatically fixes fixable linting errors in Markdown files.
- `npm run format`: Checks for formatting issues.
- `npm run format:fix`: Automatically formats files.
- `npm run format:md:fix`: Automatically formats Markdown files.

Pre-commit hooks will automatically run `eslint --fix` and `prettier --write` on staged files.

## Testing

Tests are written using Jest.

- `npm test`: Runs all tests.

Please ensure all existing tests pass before submitting a pull request. If you are adding new features or fixing bugs, please include new tests to cover your changes.

## Commit Messages

This project uses **Conventional Commits**, which is the foundation for our automated release process. Your commit messages are automatically parsed to determine the next version number and generate changelog notes.

Please follow this specification. The `commitlint` hook will prevent non-compliant messages.

### How Commit Types Affect Releases

- **`feat:`**: A commit of this type indicates a new feature has been added. This will trigger a **minor** version bump (e.g., `1.2.3` -> `1.3.0`).
- **`fix:`**: A commit of this type indicates a bug fix. This will trigger a **patch** version bump (e.g., `1.2.3` -> `1.2.4`).
- **`BREAKING CHANGE:`**: A commit that has `BREAKING CHANGE:` in its body or footer indicates a major, incompatible change. This will trigger a **major** version bump (e.g., `1.2.3` -> `2.0.0`).
- **Other types** (`docs:`, `chore:`, `refactor:`, `style:`, `test:`): These commits will be included in the release notes but **will not** trigger a release on their own.

**Example of a breaking change commit:**

```plaintext
feat: remove deprecated `getUser` method

BREAKING CHANGE: The `getUser` method has been removed. Please use `fetchUser` instead.
```

## License

By contributing to `aidoccli`, you agree that your contributions will be licensed under its MIT License.
