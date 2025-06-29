// Mock the core processing function to isolate CLI logic and test its invocation
jest.mock('./jsdocGenerator.js', () => ({
  processFilesWithJSDoc: jest.fn(),
}));

const { processFilesWithJSDoc } = require('./jsdocGenerator.js');
const {
  generateAction,
  handleInitialLogging,
  handleFinalLogging,
  handleError,
} = require('./index.js');

describe('CLI Commands', () => {
  // Store and restore original console functions and process.exitCode
  const originalConsole = { ...console };
  let originalExitCode;

  beforeEach(() => {
    // Reset mocks and console before each test
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    originalExitCode = process.exitCode;
    process.exitCode = undefined; // Reset exit code
  });

  afterAll(() => {
    // Restore original console and exitCode after all tests
    Object.assign(console, originalConsole);
    process.exitCode = originalExitCode;
  });

  describe('generate command', () => {
    describe('action handler (generateAction)', () => {
      it('should call processFilesWithJSDoc with default patterns when none are provided', async () => {
        const options = { exclude: [] };
        await generateAction([], options);

        const defaultPatterns = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'];
        expect(processFilesWithJSDoc).toHaveBeenCalledWith(
          defaultPatterns,
          options
        );
      });

      it('should call processFilesWithJSDoc with user-provided patterns', async () => {
        const patterns = ['src/**/*.js'];
        const options = { exclude: [] };
        await generateAction(patterns, options);

        expect(processFilesWithJSDoc).toHaveBeenCalledWith(patterns, options);
      });

      it('should call logging helpers on successful execution', async () => {
        const options = { exclude: [] };
        await generateAction([], options);

        expect(console.log).toHaveBeenCalledWith('--- JSDoc Generator CLI ---');
        expect(console.log).toHaveBeenCalledWith(
          '\n--- JSDoc Generation Process Complete ---'
        );
      });

      it('should call handleError when processFilesWithJSDoc throws an error', async () => {
        const testError = new Error('Test processing error');
        processFilesWithJSDoc.mockRejectedValueOnce(testError);

        const options = { exclude: [] };
        await generateAction([], options);

        expect(console.error).toHaveBeenCalledWith(
          '\n--- An error occurred during JSDoc generation ---'
        );
        expect(console.error).toHaveBeenCalledWith(testError);
        expect(process.exitCode).toBe(1);
      });
    });

    describe('helper functions', () => {
      describe('handleInitialLogging', () => {
        it('should log initial messages with default options', () => {
          handleInitialLogging([], { exclude: [] });
          expect(console.log).toHaveBeenCalledWith('--- JSDoc Generator CLI ---');
          expect(console.log).toHaveBeenCalledWith(
            'Patterns: Defaulting to all JS/TS files'
          );
        });

        it('should log verbose options when --verbose is true', () => {
          const options = { verbose: true, exclude: [] };
          handleInitialLogging([], options);
          expect(console.log).toHaveBeenCalledWith('Options:', options);
        });

        it('should warn and disable verbose if --quiet is also present', () => {
          const options = { quiet: true, verbose: true, exclude: [] };
          handleInitialLogging([], options);
          expect(console.warn).toHaveBeenCalledWith(
            'Warning: --quiet and --verbose are mutually exclusive. --quiet will take precedence.'
          );
          expect(options.verbose).toBe(false);
        });
      });

      describe('handleFinalLogging', () => {
        it('should log completion message and dry-run reminder', () => {
          handleFinalLogging({ dryRun: true });
          expect(console.log).toHaveBeenCalledWith(
            '\n--- JSDoc Generation Process Complete ---'
          );
          expect(console.log).toHaveBeenCalledWith(
            'Remember: This was a DRY RUN. No file modifications were made.'
          );
        });
      });
    });
  });
});
