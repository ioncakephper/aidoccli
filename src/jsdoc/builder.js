// src/jsdoc/builder.js

const { MANAGED_JSDOC_TAGS, VALID_JSDOC_TAGS } = require('./constants');

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
  if (lines[lines.length - 1] === '*/' || lines[lines.length - 1] === '/')
    lines.pop(); // Remove trailing JSDoc end marker

  return lines;
}

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
            `  Warning: Unrecognized JSDoc tag '@${tagName}' found in JSDoc for "${
              inferredJSDoc.functionName || inferredJSDoc.name
            }". This tag will be preserved as-is.`
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
            `@param {${param.type}} ${param.name} ${existingParam.content
              .substring(
                existingParam.content.indexOf(param.name) + param.name.length
              )
              .trim()}`
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
}