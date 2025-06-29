// src/index.js

const { Command } = require('commander');
const { processFilesWithJSDoc } = require('./jsdocGenerator.js');
const pkg = require('../package.json');

// --- Helper Functions for CLI Logic ---

/**
 * Handles the initial logging and validation of CLI options.
 * @param {string[]} patterns - The file patterns provided by the user.
 * @param {object} options - The options object from commander.
 */
function handleInitialLogging(patterns, options) {
  if (options.quiet && options.verbose) {
    console.warn(
      'Warning: --quiet and --verbose are mutually exclusive. --quiet will take precedence.'
    );
    options.verbose = false;
  }

  if (options.quiet) {
    return;
  }

  console.log('--- JSDoc Generator CLI ---');
  console.log(
    `Patterns: ${
      patterns.length > 0
        ? patterns.join(', ')
        : 'Defaulting to all JS/TS files'
    }`
  );

  if (options.exclude.length > 0) {
    console.log(`Excluded Patterns: ${options.exclude.join(', ')}`);
  }

  if (options.verbose) {
    console.log('Options:', options);
  }

  if (options.dryRun) {
    console.log('\n--- DRY RUN ENABLED ---');
    console.log('No files will be modified.');
  }
}

/**
 * Handles the final logging after the process is complete.
 * @param {object} options - The options object from commander.
 */
function handleFinalLogging(options) {
  if (options.quiet) {
    return;
  }
  console.log('\n--- JSDoc Generation Process Complete ---');
  if (options.dryRun) {
    console.log(
      'Remember: This was a DRY RUN. No file modifications were made.'
    );
  }
}

/**
 * Handles errors that occur during the process.
 * @param {Error} error - The error object.
 */
function handleError(error) {
  console.error('\n--- An error occurred during JSDoc generation ---');
  console.error(error);
  process.exitCode = 1; // Use exitCode for a graceful exit, allowing logs to flush.
}

// --- Main Program Definition ---

const program = new Command();

program.name(pkg.name).description(pkg.description).version(pkg.version);
program.configureHelp({
  sortCommands: true,
  sortSubcommands: true,
  sortOptions: true,
  showGlobalOptions: true,
  showGlobalOptionValues: true,
  showHidden: false,
  showHelpAfterError: true
});

// Define the main 'generate' command
program
  .command('generate [patterns...]')
  .description('Process files to generate or update JSDoc comments.')
  .option(
    '-o, --output <dir>',
    'Specify an output directory (defaults to in-place update)',
    '.'
  )
  .option('-v, --verbose', 'Enable verbose logging for detailed output', false)
  .option('-q, --quiet', 'Suppress all non-error output', false)
  .option(
    '-d, --dry-run',
    'Perform a dry run without modifying any files',
    false
  )
  .option(
    '--overwrite-all-jsdoc',
    'Completely overwrite all existing JSDoc for processed elements, ignoring human-written content.',
    false
  )
  .option(
    '--exclude <pattern>',
    'A glob pattern to exclude files or directories (can be repeated for multiple patterns).',
    (value, previous) => (previous || []).concat(value),
    []
  )
  .option(
    '--only-new',
    'Only add JSDoc to code elements that currently have no JSDoc block.',
    false
  )
  .option(
    '--remove-tags <tags>',
    'Comma-separated list of JSDoc tags to explicitly remove (e.g., "todo,deprecated").',
    (value) => value.split(',').map((tag) => tag.trim())
  )
  .option(
    '--ai-model <model-name>',
    'Specify the OpenAI model to use (e.g., "gpt-4o", "gpt-3.5-turbo")',
    'gpt-4o'
  )
  .option(
    '--ai-temperature <value>',
    "Set the AI's creativity/randomness (float from 0.0 to 1.0).",
    parseFloat,
    0.7
  )
  .action(generateAction);


/**
 * The main action handler for the 'generate' command.
 * It orchestrates logging, processing, and error handling.
 * @param {string[]} patterns - The file patterns provided by the user.
 * @param {object} options - The options object from commander.
 */
async function generateAction(patterns, options) {
  handleInitialLogging(patterns, options);

  const effectivePatterns =
    patterns.length > 0
      ? patterns
      : ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'];

  try {
    await processFilesWithJSDoc(effectivePatterns, options);
    handleFinalLogging(options);
  } catch (error) {
    handleError(error);
  }
}

// Export a function to run the CLI program
exports.runCli = function runCli() {
  program.parse(process.argv);

  // If no command is given, display help
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
};
