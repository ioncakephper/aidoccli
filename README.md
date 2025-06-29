# js-quality-starter-with-release

[![Release](https://github.com/your-username/your-new-repo/actions/workflows/release.yml/badge.svg)](https://github.com/your-username/your-new-repo/actions/workflows/release.yml)
[![semantic-release](https://img.shields.io/badge/semantic--release-e10079?logo=semantic-release&logoColor=white)](https://github.com/semantic-release/semantic-release)
[![codecov](https://codecov.io/gh/your-username/your-new-repo/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/your-username/your-new-repo)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A template repository for modern JavaScript projects with pre-configured linting, formatting, testing, and a fully automated release pipeline using `semantic-release`.

This template provides a solid foundation for any new JavaScript project, ensuring code quality and consistency from the start.

## Table of Contents <!-- omit in toc -->

- [Quick Start](#quick-start)
- [Why Choose `js-quality-started-with-release`?](#why-choose-js-quality-started-with-release)
- [What's Inside?](#whats-inside)
- [Getting Started](#getting-started)
  - [Using as a Template](#using-as-a-template)
  - [Manual Setup](#manual-setup)
  - [Post-Template Setup](#post-template-setup)
- [Available Scripts](#available-scripts)
- [How It Works](#how-it-works)
  - [Pre-commit and Commit Message Hooks](#pre-commit-and-commit-message-hooks)
  - [Automated Release Generation](#automated-release-generation)
- [Customization](#customization)
- [Code Coverage](#code-coverage)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

```bash
npx degit your-github-username/js-quality-starter-with-release my-new-project --force
cd my-new-project
npm install
npm test
# Start building!
```

## Why Choose `js-quality-started-with-release`?

Tired of repetitive setup, inconsistent code, and integration headaches? See how `js-quality-started-with-release` provides a superior foundation compared to starting from scratch or using basic boilerplates.

| Criteria                           | Minimal/Empty Repository | Basic Boilerplate                | `js-quality-started-with-release` Template                   |
| :--------------------------------- | :----------------------- | :------------------------------- | :----------------------------------------------------------- |
| **Core Purpose**                   | Blank slate              | Quick start, basic structure     | Quality, consistency, efficiency                             |
| **Linting (e.g., ESLint)**         | ❌ No                    | ⚙️ Manual setup required / Basic | ✅ Pre-configured, opinionated                               |
| **Formatting (e.g., Prettier)**    | ❌ No                    | ⚙️ Manual setup required         | ✅ Pre-configured                                            |
| **Testing Framework (e.g., Jest)** | ❌ No                    | ⚙️ Manual setup required         | ✅ Pre-configured with coverage                              |
| **Test Coverage Reporting**        | ❌ No                    | ❌ No                            | ✅ Included                                                  |
| **Build/Bundling Tool**            | ❌ No                    | ⚙️ Manual setup required / Basic | ✅ Pre-configured (e.g., Babel)                              |
| **Language Support**               | JS Only                  | JS Only                          | JS (easily extensible to TS)                                 |
| **Documentation Gen. Tools**       | ❌ No                    | ❌ No                            | ⚙️ Manual add/Configuring                                    |
| **CI/CD Configuration**            | ❌ No                    | ⚙️ Manual setup required / Basic | ✅ Pre-configured GitHub Actions                             |
| **Community Health Files**         | ❌ No                    | ⚙️ Basic `README.md`             | ✅ Comprehensive (`README`, `CONTRIBUTING`, `LICENSE`, etc.) |
| **Opinionation Level**             | None                     | Low                              | High (for quality tools)                                     |
| **Initial Setup Time**             | Very High                | High                             | Very Low                                                     |
| **Code Quality Assurance**         | Manual                   | Limited / Manual                 | Automated & Proactive                                        |
| **Team Collaboration Aid**         | Low                      | Moderate                         | High                                                         |

## What's Inside?

This template comes pre-configured with a suite of modern, industry-standard tools to ensure your project maintains high code quality.

| Tool               | Purpose                                                                                                                                  |
| :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **ESLint**         | Statically analyzes your code to quickly find and fix problems. It's configured with recommended rules to enforce best practices.        |
| **Prettier**       | An opinionated code formatter that enforces a consistent style across your entire codebase, eliminating arguments over code style.       |
| **Jest**           | A delightful JavaScript Testing Framework with a focus on simplicity. It's set up and ready for you to write unit and integration tests. |
| **markdownlint**   | A linter for Markdown files to enforce consistent style and catch common errors in documentation.                                        |
| **Husky**          | Manages Git hooks to make it easy to run scripts at specific stages, like before a commit.                                               |
| **lint-staged**    | Works with Husky to run linters and formatters on your staged files _before_ they are committed, ensuring no bad code gets in.           |
| **GitHub Actions** | Automates your workflow with two pre-configured CI pipelines for validating code on `main` and all other feature branches.               |

## Getting Started

### Using as a Template

1. Click the **"Use this template"** button on the GitHub repository page.
2. Select **"Create a new repository"**.
3. Give your new repository a name and description.
4. Clone your new repository to your local machine.

### Manual Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-new-repo.git # Replace with your actual repository URL
   cd your-new-repo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This will install all dependencies and also run the `prepare` script, which sets up the Husky pre-commit hooks automatically.

3. Start coding!

### Post-Template Setup

After creating your repository from this template, be sure to:

1. **Update `package.json`**: Change the `name`, `description`, and `author` fields.
2. **Update `LICENSE`**: Modify the `[year]` and `[fullname]` to reflect your project's ownership.
3. **Update `CODE_OF_CONDUCT.md` and `CONTRIBUTING.md`**: Replace the `[YOUR_PROJECT_CONTACT_EMAIL]` placeholder with a valid project contact email.
4. **Update `README.md` badges**: Replace `your-username/your-new-repo` in the badge URLs with your actual GitHub username and repository name.
5. **Configure Publishing (Optional)**: In `.releaserc.js`, change `npmPublish: false` to `npmPublish: true` if you want to publish to the npm registry. You will also need to add an `NPM_TOKEN` secret to your repository.
6. **Write Great Release Notes**: After `semantic-release` creates a new release, edit it on GitHub to add a high-level summary of the changes.

## Available Scripts

In the project directory, you can run:

- `npm test`: Runs the tests using Jest.
- `npm run lint`: Lints all `.js` files in the project.
- `npm run lint:fix`: Lints and automatically fixes fixable issues.
- `npm run format`: Checks for formatting issues with Prettier.
- `npm run format:fix`: Formats all supported files with Prettier.
- `npm run lint:md`: Lints all Markdown files.
- `npm run lint:md:fix`: Lints and automatically fixes fixable issues in Markdown files.
- `npm run format:md`: Checks for formatting issues with Prettier for Markdown files.
- `npm run format:md:fix`: Formats all Markdown files with Prettier.

## How It Works

This template is built around a fully automated, commit-driven workflow.

### Pre-commit and Commit Message Hooks

This project uses `Husky`, `lint-staged`, and `commitlint` to enforce code quality and consistent commit messages.

1. **On Staging:** When you stage files (`git add`), `lint-staged` runs formatters (`Prettier`) and linters (`ESLint`, `markdownlint`) on them. This ensures your code and documentation are clean _before_ you even write a commit message.
2. **On Commit:** When you write a commit message (`git commit`), `commitlint` validates it against the **Conventional Commits** specification. This is the most critical step, as these structured commit messages power the automated release process. If your message is not compliant (e.g., `git commit -m "updated stuff"`), the commit will be aborted.

### Automated Release Generation

This template uses **`semantic-release`** to automate the entire release process. The manual step of deciding on a version number and creating a release is completely removed.

The process is triggered every time a commit is merged into the `main` branch. Here’s what happens:

1. **Trigger:** A push or merge to the `main` branch starts the `release.yml` GitHub Actions workflow.
2. **Analysis:** `semantic-release` analyzes the commit messages since the last release.
3. **Versioning:** It automatically determines the next version number based on the types of commits:
   - `fix:` commits result in a **PATCH** release (e.g., `1.0.0` -> `1.0.1`).
   - `feat:` commits result in a **MINOR** release (e.g., `1.0.1` -> `1.1.0`).
   - Commits with `BREAKING CHANGE:` in the body result in a **MAJOR** release (e.g., `1.1.0` -> `2.0.0`).
4. **Release Generation:** If a release is warranted, `semantic-release` performs the following actions:
   - Updates `CHANGELOG.md` with the new release notes.
   - Updates the `version` in `package.json`.
   - Creates a new Git tag for the new version.
   - Creates a new GitHub Release with the generated notes.
   - Commits the updated `package.json` and `CHANGELOG.md` files back to the `main` branch.

This means you no longer need to manually tag versions. Your release cycle is tied directly to the features and fixes you merge into your main branch.

## Customization

This template is a starting point. You can easily customize it to fit your project's needs:

- **Linting Rules**: Modify the `.eslintrc.js` file to add or change ESLint rules.
- **Formatting Options**: Adjust the `.prettierrc` file to change Prettier's formatting options.
- **Markdown Linting**: Customize `markdownlint` rules by editing the `.markdownlint.json` file.
- **Testing**: The `jest.config.js` file can be configured for more advanced testing scenarios.
- **Release Configuration**: Edit the `.releaserc.js` file to customize the `semantic-release` plugins and behavior.

## Code Coverage

This template is configured to generate code coverage reports using Jest. The reports are output to the `coverage/` directory in various formats, including `lcov`, which is compatible with popular code coverage services.

To get a dynamic code coverage badge like the one at the top of this `README.md`, you can integrate with a service like Codecov or Coveralls.

**Steps to set up Codecov (example):**

1. Sign up for Codecov with your GitHub account.
2. Add your repository to Codecov.
3. Codecov will provide you with a `CODECOV_TOKEN`. Add this token as a secret in your GitHub repository settings (e.g., `CODECOV_TOKEN`).
4. Add a step to your CI workflow (`.github/workflows/ci.yml`) to upload the coverage report to Codecov. This typically involves adding a step like:

   ```yaml
   - name: Upload coverage to Codecov
     uses: codecov/codecov-action@v4
     with:
       token: ${{ secrets.CODECOV_TOKEN }}
   ```

5. Update the badge URL in `README.md` with your specific repository details and token (if required by Codecov for public repos, though often not for public repos).

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to contribute, report bugs, and suggest enhancements.

## License

This project is licensed under the [LICENSE](LICENSE.md) file for details.
