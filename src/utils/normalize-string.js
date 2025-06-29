/**
 * Normalizes a string by trimming whitespace, converting to lowercase,
 * replacing non-alphanumeric characters with dashes, collapsing multiple dashes,
 * and removing leading/trailing dashes. This is commonly used to create URL-friendly "slugs".
 *
 * @param {string} str The input string to normalize.
 * @returns {string} The normalized string.
 * @throws {Error} If the input is null or undefined.
 */
function normalizeString(str) {
  if (str === null || str === undefined) {
    throw new Error('Input cannot be null or undefined.');
  }

  let s = String(str);

  s = s.trim();
  s = s.toLowerCase();

  // Replace non-alphanumeric (excluding dash and underscore) with a dash
  s = s.replace(/[^a-z0-9_-]/g, '-');

  // Replace multiple dashes with a single dash
  s = s.replace(/-+/g, '-');

  // Remove leading/trailing dashes
  s = s.replace(/^-+|-+$/g, '');

  return s;
}

module.exports = normalizeString;
