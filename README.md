# aidoccli

**AI-powered Documentation CLI for JavaScript and TypeScript Projects**

[![Release](https://github.com/ioncakephper/aidoccli/actions/workflows/release.yml/badge.svg)](https://github.com/ioncakephper/aidoccli/actions/workflows/release.yml)
[![semantic-release](https://img.shields.io/badge/semantic--release-e10079?logo=semantic-release&logoColor=white)](https://github.com/semantic-release/semantic-release)
[![codecov](https://codecov.io/gh/ioncakephper/aidoccli/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/ioncakephper/aidoccli)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

**aidoccli** (pronounced: “AI Doc C-L-I”) is a command-line tool that leverages artificial intelligence to generate, update, and maintain high-quality documentation for your JavaScript and TypeScript codebases. Save time, ensure consistency, and improve onboarding with smart, automated docs—right from your terminal.

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

## Features

- 🚀 **Automatic Doc Generation**: Instantly create comprehensive documentation for your JS/TS projects.
- 🤖 **AI-Powered Summaries**: Let AI explain code, functions, and modules in clear, concise language.
- 🔍 **Customizable Output**: Tailor your docs to different formats (Markdown, HTML, etc.).
- 🛠️ **Easy Integration**: Use as a standalone CLI or integrate into your CI/CD pipeline.
- 📦 **Support for Modern JavaScript & TypeScript**: Handles ES modules, async code, React components, and more.

## Installation

```sh
npm install -g aidoccli
```

## Usage

```sh
aidoccli [options] <path-to-your-project>
```

### Common Commands

- `aidoccli generate ./src`  
  Generate documentation for all files in the `src` directory.

- `aidoccli update ./src/utils`  
  Update existing documentation in the `utils` folder.

- `aidoccli summary ./src/index.ts`  
  Get an AI-generated summary/explanation for a specific file.

### Options

| Option            | Description                                  |
|-------------------|----------------------------------------------|
| `-f, --format`    | Output format (markdown, html, etc.)         |
| `-o, --output`    | Output directory                             |
| `-c, --config`    | Path to config file                          |
| `-h, --help`      | Show help information                        |

## Example

```sh
aidoccli generate -f markdown -o docs ./src
```

## Why AIDocCLI?

- **Save Developer Time:** No more manual doc writing.
- **Consistent Quality:** AI ensures readability and uniformity.
- **Better Onboarding:** New team members get up to speed faster.

## Roadmap

- [ ] Add support for additional languages
- [ ] Interactive Q&A for codebases
- [ ] Integration with GitHub Actions

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

## Manage repository files

This repository is built around a fully automated, commit-driven workflow.

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

You can easily customize this repository to fit your project's needs:

- **Linting Rules**: Modify the `.eslintrc.js` file to add or change ESLint rules.
- **Formatting Options**: Adjust the `.prettierrc` file to change Prettier's formatting options.
- **Markdown Linting**: Customize `markdownlint` rules by editing the `.markdownlint.json` file.
- **Testing**: The `jest.config.js` file can be configured for more advanced testing scenarios.
- **Release Configuration**: Edit the `.releaserc.js` file to customize the `semantic-release` plugins and behavior.

## Code Coverage

This project is configured to generate code coverage reports using Jest. The reports are output to the `coverage/` directory in various formats, including `lcov`, which is compatible with popular code coverage services.

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
