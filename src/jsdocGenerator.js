// jsdocGenerator.js

const ts = require('typescript');
const fs = require('fs-extra');
const { glob } = require('glob');
// Remove direct OpenAI import; use shared API module instead
const babelParser = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;

// Load environment variables (e.g., OPENAI_API_KEY)
const dotenv = require('dotenv');
dotenv.config();

// Import the new, refactored modules
const {
  inferClassJSDoc,
  inferFunctionOrConstructorJSDoc,
} = require('./inference/engine.js');
const {
  getJSDocBlocks,
  updateJSDocBlock,
  buildJSDocLines,
} = require('./jsdoc/builder.js');

/**
 * Finds the TypeScript symbol for a given Babel AST node.
 * @param {ts.TypeChecker} checker - The TypeScript TypeChecker.
 * @param {import('@babel/core').NodePath} path - The Babel path of the node.
 * @returns {ts.Symbol | undefined} The found symbol or undefined.
 */
function getSymbolForNode(checker, path) {
  const node = path.node;
  if (node.id) {
    return checker.getSymbolAtLocation(node.id);
  }
  if (node.key && path.isClassMethod()) {
    return checker.getSymbolAtLocation(node.key);
  }
  if (path.parentPath.isVariableDeclarator() && path.parentPath.node.id) {
    return checker.getSymbolAtLocation(path.parentPath.node.id);
  }
  return undefined;
}

// --- Main: Process Files and Update JSDoc ---
exports.processFilesWithJSDoc = async function processFilesWithJSDoc(
  globPatterns,
  options = {}
) {
  const files = await glob(globPatterns, { ignore: options.exclude });
  console.log(`Found ${files.length} JavaScript/TypeScript files to process.`);
  if (files.length === 0) {
    console.log('No files matching the provided patterns were found.');
    return;
  }
  const program = ts.createProgram(files, {});
  const checker = program.getTypeChecker();
  for (const filePath of files) {
    console.log(`\nProcessing file: ${filePath}`);
    let code = await fs.readFile(filePath, 'utf-8');
    const babelAst = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    let fileModified = false;
    // 1. Synchronously traverse the AST to collect all nodes that need processing.
    // This avoids issues with async operations inside the traverse visitor.
    const nodesToProcess = [];
    traverse(babelAst, {
      enter(path) {
        if (
          path.isClassDeclaration() ||
          path.isClassExpression() ||
          path.isClassMethod() ||
          path.isFunctionDeclaration() ||
          path.isFunctionExpression() ||
          path.isArrowFunctionExpression()
        ) {
          nodesToProcess.push(path);
        }
      },
    });

    // 2. Asynchronously process each collected node.
    for (const path of nodesToProcess) {
      try {
        const node = path.node;
        const existingJSDoc = getJSDocBlocks(node.leadingComments);

        if (options.onlyNew && existingJSDoc) {
          continue; // Skip if it already has JSDoc and --only-new is used
        }

        let inferredJSDoc = null;
        const rawCode = generate(node).code;

        if (path.isClassDeclaration() || path.isClassExpression()) {
          const classSymbol = checker.getSymbolAtLocation(node.id || node);
          if (classSymbol) {
            console.log(`  Analyzing class: ${classSymbol.getName()}`);
            inferredJSDoc = await inferClassJSDoc(
              checker,
              classSymbol,
              rawCode,
              options
            );
          }
        } else {
          // It's a function or method
          const symbol = getSymbolForNode(checker, path);
          if (symbol) {
            const name = symbol.getName();
            if (name && name !== '__function') {
              console.log(`  Analyzing function: ${name}`);
              inferredJSDoc = await inferFunctionOrConstructorJSDoc(
                checker,
                symbol,
                rawCode,
                options
              );
            }
          }
        }

        if (inferredJSDoc) {
          const newJSDocLines =
            existingJSDoc && !options.overwriteAllJsdoc
              ? updateJSDocBlock(existingJSDoc, inferredJSDoc)
              : buildJSDocLines(inferredJSDoc);

          if (newJSDocLines.length > 0) {
            const newCommentContent = `*\n * ${newJSDocLines.join('\n * ')}\n `;
            const newComment = {
              type: 'CommentBlock',
              value: newCommentContent,
            };

            if (!node.leadingComments) node.leadingComments = [];

            const existingJsdocIndex = node.leadingComments.findIndex(
              (c) => c.type === 'CommentBlock' && c.value.startsWith('*')
            );

            if (existingJsdocIndex !== -1) {
              node.leadingComments[existingJsdocIndex] = newComment;
            } else {
              node.leadingComments.unshift(newComment);
            }
            fileModified = true;
          }
        }
      } catch (e) {
        console.error(`  Skipping node due to unexpected error: ${e.message}`);
      }
    }

    if (fileModified) {
      if (options.dryRun) {
        console.log(`  Would update ${filePath} (Dry Run)`);
      } else {
        const output = generate(babelAst, {
          retainLines: true,
          comments: true,
        }).code;
        await fs.writeFile(filePath, output, 'utf-8');
        console.log(`  Successfully updated ${filePath}`);
      }
    } else {
      console.log(`  No JSDoc updates needed for ${filePath}`);
    }
  }
};
