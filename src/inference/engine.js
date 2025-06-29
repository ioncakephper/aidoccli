// src/inference/engine.js

const ts = require('typescript');
const { callOpenAI } = require('../ai/openai');

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

/**
 * Infers JSDoc details for a class based on its TypeScript Symbol.
 * @param {ts.TypeChecker} checker - TypeScript TypeChecker instance.
 * @param {ts.Symbol} classSymbol - TypeScript Symbol for the class.
 * @param {string} rawCode - The raw code string of the class.
 * @param {object} options - The CLI options object.
 * @returns {Promise<object>} Inferred JSDoc properties.
 */
async function inferClassJSDoc(checker, classSymbol, rawCode, options) {
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
      options
    );

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
 * @param {object} options - The CLI options object.
 * @returns {Promise<object>} Inferred JSDoc properties.
 */
async function inferFunctionOrConstructorJSDoc(
  checker,
  symbol,
  rawCode,
  options
) {
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
        } else if (
          returnTypeString === 'Promise<void>' ||
          returnTypeString === 'Promise<any>'
        ) {
          // For async functions that implicitly return void or any, just indicate Promise<void>
          returnTypeString = 'Promise<void>';
        } else if (returnTypeString === 'void' && isAsync) {
          returnTypeString = 'Promise<void>'; // Explicitly typed void for async should still return Promise<void>
        }
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

    const response = await callOpenAI(prompt, options);
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

module.exports = {
  inferClassJSDoc,
  inferFunctionOrConstructorJSDoc,
};
