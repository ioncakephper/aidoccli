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

// --- OpenAI Configuration ---
// Import the shared OpenAI API call function
const { callOpenAI } = require('./ai/openai');

// --- JSDoc Tag Definitions ---
// Tags that the generator will try to manage, generate, or overwrite.
// Their content might be replaced by AI-generated descriptions or inferred types.
const MANAGED_JSDOC_TAGS = new Set([
  'param',
  'returns',
  'throws',
  'example',
  'class',
  'description',
]);

// A broader list of valid JSDoc tags. Tags not in MANAGED_JSDOC_TAGS but in this list
// will be preserved as-is. Tags not in this list will be preserved but with a warning.
const VALID_JSDOC_TAGS = new Set([
  'abstract',
  'access',
  'alias',
  'arg',
  'argument',
  'async',
  'augments',
  'author',
  'borrows',
  'callback',
  'class',
  'classdesc',
  'const',
  'constant',
  'constructor',
  'constructs',
  'copyright',
  'default',
  'defaultvalue',
  'deprecated',
  'desc',
  'description',
  'enum',
  'event',
  'example',
  'exports',
  'external',
  'file',
  'fileoverview',
  '' /* allows for empty lines/main desc */,
  'fires',
  'function',
  'func',
  'host',
  'ignore',
  'implements',
  'inheritdoc',
  'inner',
  'instance',
  'interface',
  'internal',
  'kind',
  'lends',
  'license',
  'listens',
  'member',
  'memberof',
  'method',
  'mixes',
  'mixin',
  'module',
  'name',
  'namespace',
  'override',
  'overrides',
  'package',
  'param',
  'private',
  'property',
  'prop',
  'protected',
  'public',
  'readonly',
  'requires',
  'returns',
  'return',
  'see',
  'since',
  'static',
  'summary',
  'super',
  'this',
  'throws',
  'throw',
  'todo',
  'tutorial',
  'type',
  'typedef',
  'var',
  'variation',
  'version',
  'virtual',
  'yields',
  'yield',
]);

// --- Core Logic for JSDoc Generation ---

/**
 * Extracts existing JSDoc comments from a Node's leading comments.
 * @param {Array<object>} comments - Array of comment objects from Babel AST.
 * @returns {string[]} An array of lines representing the JSDoc block, or null if not found.
 */
function getJSDocBlocks(comments) {
  if (!comments || comments.length === 0) {
    return null;
  }
  const jsdocComment = comments.find(
    (comment) =>
      comment.type === 'CommentBlock' && comment.value.startsWith('*')
  );
  if (!jsdocComment) {
    return null;
  }
  // Clean up the JSDoc block: split by lines, trim leading '*', handle '*' on empty lines
  const lines = jsdocComment.value.split('\n').map((line) => {
    line = line.trim();
    if (line.startsWith('*')) {
      line = line.substring(1).trim();
    }
    return line;
  });
  // Remove leading empty line and trailing '*/' line equivalent
  if (lines[0] === '') lines.shift();
  if (lines[lines.length - 1] === '*/' || lines[lines.length - 1] === '/') lines.pop(); // Remove trailing JSDoc end marker

  return lines;
}

/**
 * Infers JSDoc details for a class based on its TypeScript Symbol.
 * @param {ts.TypeChecker} checker - TypeScript TypeChecker instance.
 * @param {ts.Symbol} classSymbol - TypeScript Symbol for the class.
 * @param {string} rawCode - The raw code string of the class.
 * @returns {Promise<object>} Inferred JSDoc properties.
 */
async function inferClassJSDoc(checker, classSymbol, rawCode) {
  const className = classSymbol.getName();
  let description = 'Description placeholder.';
  let examples = [];
  let constructorParams = [];
  let extendsClass = null;

  // Get constructor parameters
  const constructorDeclaration =
    classSymbol.members?.get('constructor')?.declarations?.[0];

  if (
    constructorDeclaration &&
    ts.isConstructorDeclaration(constructorDeclaration)
  ) {
    constructorParams = await Promise.all(
      constructorDeclaration.parameters.map(async (param) => {
        const paramName = param.name.getText();
        const paramType = checker.getTypeOfSymbolAtLocation(
          checker.getSymbolAtLocation(param.name),
          param.name
        );
        let inferredTypeString = checker.typeToString(paramType);
        if (inferredTypeString === 'any') {
          // Try to refine 'any' if possible or if not explicitly typed
          const typeNode = param.type;
          if (typeNode) {
            inferredTypeString = typeNode.getText(); // Use the raw text if 'any' is too broad
          } else {
            // Fallback to basic types for untyped JS if TS gives 'any'
            inferredTypeString = 'object'; // Or 'any' if truly unknown
          }
        }

        let defaultValue = null;
        if (param.initializer) {
          defaultValue = param.initializer.getText();
        }

        let desc = getParamDescription(paramName, inferredTypeString);
        if (defaultValue !== null) {
          desc += ` Defaults to \`${defaultValue}\`.`;
        }

        return {
          name: paramName,
          type: inferredTypeString,
          description: desc,
        };
      })
    );
  }

  // Check for inheritance
  const extendsClause =
    classSymbol.declarations?.[0]?.heritageClauses?.[0]?.types?.[0];
  if (extendsClause) {
    extendsClass = extendsClause.getText();
  }

  try {
    const response = await callOpenAI(
      `
            Given the TypeScript/JavaScript class "${className}" with the following code:
            \`\`\`typescript
            ${rawCode}
            \`\`\`
            Generate:
            1. A concise, professional description for the class.
            2. One to two relevant, runnable JavaScript/TypeScript example usage blocks demonstrating class instantiation and primary functionality. Ensure examples are valid code and follow JSDoc example block format.
            3. A description for its constructor, if applicable, based on its parameters and what it initializes.

            Format the output as a JSON object:
            {
                "description": "...",
                "examples": ["Example block 1", "Example block 2"],
                "constructorDescription": "..."
            }
            If no examples or constructor are needed, provide empty arrays or strings.
            `,
      'gpt-4o'
    ); // Use a more capable model for class summaries

    const parsedResponse = JSON.parse(response);
    description = parsedResponse.description || description;
    examples = parsedResponse.examples || examples;

    return {
      name: className,
      description,
      examples,
      constructorParams,
      constructorDescription: parsedResponse.constructorDescription,
      extendsClass,
    };
  } catch (error) {
    console.error(
      `Error inferring JSDoc for class ${className} with OpenAI:`,
      error.message
    );
    // Fallback with basic inference
    return {
      name: className,
      description: `A class representing ${className}.`,
      examples: [],
      constructorParams,
      constructorDescription: `Initializes a new instance of the ${className} class.`,
      extendsClass,
    };
  }
}

/**
 * Infers JSDoc details for a function or constructor based on its TypeScript Symbol.
 * @param {ts.TypeChecker} checker - TypeScript TypeChecker instance.
 * @param {ts.Symbol} symbol - TypeScript Symbol for the function or constructor.
 * @param {string} rawCode - The raw code string of the function/method.
 * @returns {Promise<object>} Inferred JSDoc properties.
 */
async function inferFunctionOrConstructorJSDoc(checker, symbol, rawCode) {
  const functionName = symbol.getName();
  let description = 'Description placeholder.';
  const params = [];
  let returns = { type: 'void', description: 'The result of the operation.' };
  const throws = [];
  const examples = [];

  // Get parameters
  const declaration = symbol.declarations?.[0];
  let isAsync = false;

  if (
    declaration &&
    (ts.isFunctionDeclaration(declaration) ||
      ts.isMethodDeclaration(declaration) ||
      ts.isConstructorDeclaration(declaration) ||
      ts.isArrowFunction(declaration))
  ) {
    // Check for async keyword
    isAsync =
      ts.isFunctionLike(declaration) &&
      (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Async) !== 0;

    for (const param of declaration.parameters) {
      const paramSymbol = checker.getSymbolAtLocation(param.name);
      const paramName = paramSymbol.getName();
      const paramType = checker.getTypeOfSymbolAtLocation(
        paramSymbol,
        param.name
      );
      let inferredTypeString = checker.typeToString(paramType);
      if (inferredTypeString === 'any') {
        // Try to refine 'any' if possible or if not explicitly typed
        const typeNode = param.type;
        if (typeNode) {
          inferredTypeString = typeNode.getText(); // Use the raw text if 'any' is too broad
        } else {
          // Fallback to basic types for untyped JS if TS gives 'any'
          inferredTypeString = 'object'; // Or 'any' if truly unknown
        }
      }

      let defaultValue = null;
      if (param.initializer) {
        defaultValue = param.initializer.getText();
      }

      let desc = getParamDescription(paramName, inferredTypeString);
      if (defaultValue !== null) {
        desc += ` Defaults to \`${defaultValue}\`.`;
      }

      params.push({
        name: paramName,
        type: inferredTypeString,
        description: desc,
      });
    }

    // Get return type
    const signature = checker.getSignatureFromDeclaration(declaration);
    if (signature) {
      const returnType = checker.getReturnTypeOfSignature(signature);
      let returnTypeString = checker.typeToString(returnType);

      // Handle Promises for async functions
      if (isAsync && returnTypeString.startsWith('Promise<')) {
        // If it's explicitly typed as Promise<void>, keep it. Otherwise, extract inner type.
        if (returnTypeString !== 'Promise<void>') {
          const match = returnTypeString.match(/Promise<(.*)>/);
          if (match && match[1]) {
            returnTypeString = `Promise<${match[1]}>`; // Keep Promise<T> if T is something other than void
          }
        }
      } else if (
        returnTypeString === 'Promise<void>' ||
        returnTypeString === 'Promise<any>'
      ) {
        // For async functions that implicitly return void or any, just indicate Promise<void>
        returnTypeString = 'Promise<void>';
      } else if (returnTypeString === 'void' && isAsync) {
        returnTypeString = 'Promise<void>'; // Explicitly typed void for async should still return Promise<void>
      }

      returns.type = returnTypeString || 'void';
    }
  }

  try {
    const prompt = `
            Given the TypeScript/JavaScript code for the function/method "${functionName}" and its signature:
            \`\`\`typescript
            ${rawCode}
            \`\`\`
            Based on the code, generate:
            1. A concise, professional description for the function/method.
            2. A brief description for what it returns.
            3. A brief description for any errors it might throw.
            4. One to two relevant, runnable JavaScript/TypeScript example usage blocks demonstrating its primary functionality. Ensure examples are valid code and follow JSDoc example block format. Cover happy path, and if applicable, edge cases or throwing paths.

            Format the output as a JSON object:
            {
                "description": "...",
                "returnsDescription": "...",
                "throwsDescription": ["Error message 1", "Error message 2"],
                "examples": ["Example block 1", "Example block 2"]
            }
            If no descriptions, returns, throws, or examples are needed, provide empty arrays or strings.
            `;

    const response = await callOpenAI(prompt, 'gpt-4o');
    const parsedResponse = JSON.parse(response);

    description = parsedResponse.description || description;
    returns.description =
      parsedResponse.returnsDescription || returns.description;
    if (
      parsedResponse.throwsDescription &&
      parsedResponse.throwsDescription.length > 0
    ) {
      // Assuming throwsDescription is an array of strings like ["Error message", "Another error message"]
      parsedResponse.throwsDescription.forEach((errDesc) =>
        throws.push({ description: errDesc })
      );
    }
    parsedResponse.examples?.forEach((example) => examples.push(example));
  } catch (error) {
    console.error(
      `Error inferring JSDoc for ${functionName} with OpenAI:`,
      error.message
    );
    // Fallback with basic inference if OpenAI fails
    description = `Performs the operation related to ${functionName}.`;
  }

  return { functionName, description, params, returns, throws, examples };
}

/**
 * Generates a default description for a parameter.
 * @param {string} paramName - The name of the parameter.
 * @param {string} inferredTypeString - The inferred type of the parameter.
 * @returns {string} The generated parameter description.
 */
function getParamDescription(paramName, inferredTypeString) {
  if (paramName === 'options' && inferredTypeString === 'object') {
    return 'Configuration options.';
  }
  return `The ${inferredTypeString} value of ${paramName}.`;
}

// Removed duplicate callOpenAI implementation; now using shared module from ./ai/openai

/**
 * Updates an existing JSDoc block with new or inferred information.
 * Preserves existing, non-placeholder content for descriptions and unmanaged tags.
 * @param {string[]} existingJSDocLines - Array of lines from the existing JSDoc comment.
 * @param {object} inferredJSDoc - Object containing inferred JSDoc properties.
 * @param {string} [inferredJSDoc.description] - Main description.
 * @param {Array<object>} [inferredJSDoc.params] - Array of parameter objects.
 * @param {object} [inferredJSDoc.returns] - Returns object.
 * @param {Array<object>} [inferredJSDoc.throws] - Array of throws objects.
 * @param {Array<string>} [inferredJSDoc.examples] - Array of example code blocks.
 * @param {string} [inferredJSDoc.constructorDescription] - Description for constructor.
 * @param {Array<object>} [inferredJSDoc.constructorParams] - Parameters for constructor.
 * @param {string} [inferredJSDoc.extendsClass] - Class extended.
 * @param {string} [inferredJSDoc.functionName] - Name of the function/method.
 * @param {string} [inferredJSDoc.name] - Name of the class.
 * @returns {string[]} The updated JSDoc lines.
 */
function updateJSDocBlock(existingJSDocLines, inferredJSDoc) {
  const updatedLines = [];
  const existingTags = new Map(); // Store existing tags by name (e.g., param, returns) or full line for others
  let mainDescription = '';
  let foundMainDescription = false;

  // Parse existing JSDoc lines
  for (const line of existingJSDocLines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('@')) {
      const parts = trimmedLine.split(' ');
      let tagName = parts[0].substring(1); // Remove '@'
      const tagContent = parts.slice(1).join(' ').trim();

      if (tagName === 'return') tagName = 'returns'; // Normalize 'return' to 'returns'

      if (MANAGED_JSDOC_TAGS.has(tagName)) {
        // For managed tags, we'll decide later whether to keep or replace content.
        // Store original content to compare with placeholders.
        if (!existingTags.has(tagName)) {
          existingTags.set(tagName, []);
        }
        existingTags
          .get(tagName)
          .push({ originalLine: trimmedLine, content: tagContent });
      } else {
        // For other valid tags or unrecognized tags, keep them as-is.
        if (!VALID_JSDOC_TAGS.has(tagName)) {
          console.warn(
            `  Warning: Unrecognized JSDoc tag '@${tagName}' found in JSDoc for "${inferredJSDoc.functionName || inferredJSDoc.name}". This tag will be preserved as-is.`
          );
        }
        if (!existingTags.has('other')) {
          existingTags.set('other', []);
        }
        existingTags
          .get('other')
          .push({ originalLine: trimmedLine, content: tagContent });
      }
    } else if (trimmedLine !== '' && !foundMainDescription) {
      // Capture main description, if not already found.
      // Multiple lines are concatenated as the main description.
      if (mainDescription === '') {
        mainDescription = trimmedLine;
      } else {
        mainDescription += '\n' + trimmedLine;
      }
    }
  }

  // --- Construct the new JSDoc ---

  // 1. Main Description
  const placeholderDesc = 'Description placeholder.'; // Check against common placeholders
  const existingMainDescriptionIsPlaceholder =
    mainDescription === '' || mainDescription.includes(placeholderDesc);

  if (
    inferredJSDoc.description &&
    inferredJSDoc.description !== placeholderDesc
  ) {
    if (!existingMainDescriptionIsPlaceholder) {
      updatedLines.push(mainDescription); // Preserve human-written main description
    } else {
      updatedLines.push(inferredJSDoc.description); // Use inferred if no good existing
    }
  } else if (mainDescription !== '') {
    updatedLines.push(mainDescription); // If no new desc but old exists, keep it
  }

  // Add a blank line after description if it exists and there will be tags
  if (
    updatedLines.length > 0 &&
    (inferredJSDoc.params?.length ||
      inferredJSDoc.returns?.type ||
      inferredJSDoc.throws?.length ||
      inferredJSDoc.examples?.length ||
      existingTags.size > 0)
  ) {
    updatedLines.push('');
  }

  // 2. Class-specific tags
  if (inferredJSDoc.name) {
    // It's a class
    if (!existingTags.has('class')) {
      updatedLines.push(`@class`);
    } else {
      // If class tag exists, keep original line, might have custom content
      updatedLines.push(existingTags.get('class')[0].originalLine);
    }

    if (inferredJSDoc.extendsClass) {
      const existingExtends =
        existingTags.get('augments') || existingTags.get('extends');
      if (
        !existingExtends ||
        existingExtends.some((e) => e.content !== inferredJSDoc.extendsClass)
      ) {
        updatedLines.push(`@augments ${inferredJSDoc.extendsClass}`);
      } else {
        updatedLines.push(existingExtends[0].originalLine);
      }
    }
  }

  // 3. Constructor specific tags
  if (inferredJSDoc.constructorDescription) {
    const constructorDescPlaceholder =
      'Initializes a new instance of the class.'; // Generic placeholder
    const existingConsDesc = existingTags
      .get('constructor')
      ?.find((tag) => tag.content !== constructorDescPlaceholder);
    if (existingConsDesc) {
      updatedLines.push(`@constructor ${existingConsDesc.content}`);
    } else if (
      inferredJSDoc.constructorDescription &&
      inferredJSDoc.constructorDescription !== constructorDescPlaceholder
    ) {
      updatedLines.push(`@constructor ${inferredJSDoc.constructorDescription}`);
    } else if (existingTags.has('constructor')) {
      updatedLines.push(existingTags.get('constructor')[0].originalLine); // Fallback to original if placeholder
    }
    // If constructor has specific params, prioritize them.
    if (
      inferredJSDoc.constructorParams &&
      inferredJSDoc.constructorParams.length > 0
    ) {
      inferredJSDoc.constructorParams.forEach((param) => {
        const existingParam = existingTags
          .get('param')
          ?.find((p) => p.content.startsWith(`{${param.type}} ${param.name}`));
        if (
          existingParam &&
          existingParam.content !== `The ${param.type} value of ${param.name}.`
        ) {
          updatedLines.push(
            `@param {${param.type}} ${param.name} ${existingParam.content.substring(existingParam.content.indexOf(param.name) + param.name.length).trim()}`
          );
        } else {
          updatedLines.push(
            `@param {${param.type}} ${param.name} - ${param.description}`
          );
        }
      });
    }
  }

  // 4. Parameters
  inferredJSDoc.params?.forEach((param) => {
    // Find if an existing @param tag for this parameter (by name and type) already exists with non-placeholder content
    const existingParam = existingTags
      .get('param')
      ?.find((p) => p.content.includes(`{${param.type}} ${param.name}`));
    const placeholderParamDesc = `The ${param.type} value of ${param.name}.`; // Common placeholder pattern
    const isExistingParamPlaceholder =
      existingParam?.content.includes(placeholderParamDesc);

    if (existingParam && !isExistingParamPlaceholder) {
      // Use existing description if it's not a placeholder
      // Extract the original description part from the full line if it exists
      let originalDescription = existingParam.content
        .substring(
          existingParam.content.indexOf(param.name) + param.name.length
        )
        .trim();
      if (originalDescription.startsWith('-'))
        originalDescription = originalDescription.substring(1).trim(); // Remove leading hyphen
      updatedLines.push(
        `@param {${param.type}} ${param.name} - ${originalDescription}`
      );
    } else {
      // Use inferred description
      updatedLines.push(
        `@param {${param.type}} ${param.name} - ${param.description}`
      );
    }
  });

  // 5. Returns
  if (
    inferredJSDoc.returns &&
    inferredJSDoc.returns.type &&
    inferredJSDoc.returns.type !== 'void'
  ) {
    const placeholderReturnsDesc = 'The result of the operation.';
    const existingReturns = existingTags
      .get('returns')
      ?.find((tag) => tag.content !== placeholderReturnsDesc);

    if (
      existingReturns &&
      existingReturns.content !== '' &&
      existingReturns.content !== placeholderReturnsDesc
    ) {
      updatedLines.push(
        `@returns {${inferredJSDoc.returns.type}} ${existingReturns.content}`
      );
    } else {
      updatedLines.push(
        `@returns {${inferredJSDoc.returns.type}} ${inferredJSDoc.returns.description}`
      );
    }
  }

  // 6. Throws
  inferredJSDoc.throws?.forEach((thr) => {
    // For throws, if the inferred description is new, add it.
    // Or if existing throws are placeholders, replace them.
    const existingThrow = existingTags
      .get('throws')
      ?.find((t) => t.content.includes(thr.description));
    if (!existingThrow) {
      // Only add if it's genuinely new or replacing a generic placeholder
      updatedLines.push(`@throws {Error} ${thr.description}`); // Assuming type Error for now
    } else {
      // If exists, keep original unless it's a placeholder
      updatedLines.push(existingThrow.originalLine);
    }
  });

  // 7. Examples
  inferredJSDoc.examples?.forEach((example) => {
    // Add only if the example content isn't a placeholder and doesn't exactly match an existing one
    const cleanedExample = example
      .replace(/```(?:javascript|typescript)?\n|\n```/g, '')
      .trim(); // Remove code block wrappers for comparison
    const exists = existingTags
      .get('example')
      ?.some(
        (ex) =>
          ex.content
            .replace(/```(?:javascript|typescript)?\n|\n```/g, '')
            .trim() === cleanedExample
      );
    if (!exists && example.includes('```')) {
      // Only add if it's a valid code example block
      updatedLines.push(`@example ${example}`);
    }
  });

  // 8. Other existing tags (preserved)
  existingTags.get('other')?.forEach((tag) => {
    updatedLines.push(tag.originalLine);
  });

  return updatedLines;
}

/**
 * Main function to process files and update JSDoc comments.
 * @param {string[]} globPatterns - Array of glob patterns for files to process.
 */
exports.processFilesWithJSDoc = async function processFilesWithJSDoc(globPatterns) {
  const files = await glob(globPatterns);
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

    // Parse code with Babel to get AST and access leading comments easily
    const babelAst = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'], // Support JSX and TypeScript
    });

    let fileModified = false;

    traverse(babelAst, {
      async enter(path) {
        let node = path.node;
        let jsdocComment = getJSDocBlocks(node.leadingComments);
        let inferredJSDoc = null;
        let rawCode = generate(node).code; // Get code of the current node

        if (path.isClassDeclaration() || path.isClassExpression()) {
          const classSymbol = checker.getSymbolAtLocation(node.id || node);
          if (classSymbol) {
            console.log(`  Updating JSDoc for class: ${classSymbol.getName()}`);
            inferredJSDoc = await inferClassJSDoc(
              checker,
              classSymbol,
              rawCode
            );
          }
        } else if (
          path.isClassMethod() ||
          path.isFunctionDeclaration() ||
          path.isFunctionExpression() ||
          path.isArrowFunctionExpression()
        ) {
          let symbol = null;
          if (node.id) {
            // FunctionDeclaration, FunctionExpression (named)
            symbol = checker.getSymbolAtLocation(node.id);
          } else if (node.key && path.isClassMethod()) {
            // ClassMethod
            symbol = checker.getSymbolAtLocation(node.key);
          } else {
            // Anonymous function, ArrowFunctionExpression (assigned to a variable)
            // Try to get symbol from parent variable declarator if it's an arrow function assigned to a const
            if (
              path.parentPath.isVariableDeclarator() &&
              path.parentPath.node.id
            ) {
              symbol = checker.getSymbolAtLocation(path.parentPath.node.id);
            } else {
              // For truly anonymous functions/methods without an easily retrievable symbol,
              // we'll just use a generic name or skip if symbol is strictly needed.
              // For simplicity, we'll try to use a placeholder or skip if no symbol can be found.
              symbol = { getName: () => node.type }; // Fallback name
            }
          }

          if (symbol) {
            console.log(`  Generating JSDoc for function: ${symbol.getName()}`);
            inferredJSDoc = await inferFunctionOrConstructorJSDoc(
              checker,
              symbol,
              rawCode
            );
          }
        }

        if (inferredJSDoc) {
          let newJSDocLines = [];
          if (jsdocComment) {
            newJSDocLines = updateJSDocBlock(jsdocComment, inferredJSDoc);
          } else {
            // Create new JSDoc block
            if (inferredJSDoc.name) {
              // It's a class
              newJSDocLines.push(inferredJSDoc.description);
              newJSDocLines.push(`@class`);
              if (inferredJSDoc.extendsClass)
                newJSDocLines.push(`@augments ${inferredJSDoc.extendsClass}`);
              if (inferredJSDoc.examples && inferredJSDoc.examples.length > 0) {
                newJSDocLines.push('');
                inferredJSDoc.examples.forEach((ex) =>
                  newJSDocLines.push(`@example ${ex}`)
                );
              }
              // Handle constructor if it was the target of inferredJSDoc (class method 'constructor')
              if (inferredJSDoc.constructorDescription) {
                newJSDocLines.push(
                  `@constructor ${inferredJSDoc.constructorDescription}`
                );
                inferredJSDoc.constructorParams?.forEach((param) =>
                  newJSDocLines.push(
                    `@param {${param.type}} ${param.name} - ${param.description}`
                  )
                );
              }
            } else {
              // It's a function/method
              newJSDocLines.push(inferredJSDoc.description);
              if (inferredJSDoc.params && inferredJSDoc.params.length > 0) {
                newJSDocLines.push(''); // Add a blank line before params
                inferredJSDoc.params.forEach((param) =>
                  newJSDocLines.push(
                    `@param {${param.type}} ${param.name} - ${param.description}`
                  )
                );
              }
              if (
                inferredJSDoc.returns &&
                inferredJSDoc.returns.type &&
                inferredJSDoc.returns.type !== 'void'
              ) {
                newJSDocLines.push(
                  `@returns {${inferredJSDoc.returns.type}} ${inferredJSDoc.returns.description}`
                );
              }
              if (inferredJSDoc.throws && inferredJSDoc.throws.length > 0) {
                inferredJSDoc.throws.forEach((thr) =>
                  newJSDocLines.push(`@throws {Error} ${thr.description}`)
                );
              }
              if (inferredJSDoc.examples && inferredJSDoc.examples.length > 0) {
                inferredJSDoc.examples.forEach((ex) =>
                  newJSDocLines.push(`@example ${ex}`)
                );
              }
            }
          }

          if (newJSDocLines.length > 0) {
            const newCommentContent = `*\n * ${newJSDocLines.join('\n * ')}\n `;
            const newComment = babelParser.parseExpression(
              `/**${newCommentContent}*/ ''`,
              { plugins: ['jsx', 'typescript'] }
            ).leadingComments[0];

            // Ensure comments array exists
            if (!node.leadingComments) {
              node.leadingComments = [];
            }
            // Replace existing JSDoc or add new one
            const existingJsdocIndex = node.leadingComments.findIndex(
              (c) => c.type === 'CommentBlock' && c.value.startsWith('*')
            );
            if (existingJsdocIndex !== -1) {
              node.leadingComments[existingJsdocIndex] = newComment;
            } else {
              // If no existing JSDoc, add it as the first leading comment
              node.leadingComments.unshift(newComment);
            }
            fileModified = true;
          }
        }
      },
    });

    if (fileModified) {
      const output = generate(babelAst, {
        retainLines: true,
        comments: true,
      }).code;
      await fs.writeFile(filePath, output, 'utf-8');
      console.log(`  Successfully updated ${filePath}`);
    } else {
      console.log(`  No JSDoc updates needed for ${filePath}`);
    }
  }
  console.log('JSDoc processing complete.');
};
