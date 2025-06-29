const {
  getJSDocBlocks,
  updateJSDocBlock,
  buildJSDocLines,
} = require('../jsdoc/builder.js');

describe('JSDoc Builder', () => {
  describe('getJSDocBlocks', () => {
    it('should return null if no comments are provided', () => {
      expect(getJSDocBlocks(null)).toBeNull();
      expect(getJSDocBlocks([])).toBeNull();
    });

    it('should return null if no JSDoc comments are found', () => {
      const comments = [{ type: 'CommentLine', value: ' A regular comment' }];
      expect(getJSDocBlocks(comments)).toBeNull();
    });

    it('should correctly parse a valid JSDoc block', () => {
      const comments = [
        {
          type: 'CommentBlock',
          value: '*\n * This is a description.\n * @param {string} name - The name.\n ',
        },
      ];
      const expected = ['This is a description.', '@param {string} name - The name.'];
      const result = getJSDocBlocks(comments);
      expect(result).toEqual(expected);
    });
  });

  describe('buildJSDocLines', () => {
    it('should build a JSDoc block for a simple function', () => {
      const inferred = {
        description: 'Calculates the sum of two numbers.',
        params: [{ name: 'a', type: 'number', description: 'The first number.' }],
        returns: { type: 'number', description: 'The total sum.' },
      };
      const expected = [
        'Calculates the sum of two numbers.',
        '',
        '@param {number} a - The first number.',
        '@returns {number} The total sum.',
      ];
      expect(buildJSDocLines(inferred)).toEqual(expected);
    });

    it('should build a JSDoc block for a class with a constructor', () => {
      const inferred = {
        name: 'User',
        description: 'Represents a user in the system.',
        extendsClass: 'Person',
        constructorDescription: 'Creates a new user.',
        constructorParams: [
          { name: 'id', type: 'string', description: 'The user ID.' },
        ],
      };
      const expected = [
        'Represents a user in the system.',
        '@class',
        '@augments Person',
        '@constructor Creates a new user.',
        '@param {string} id - The user ID.',
      ];
      expect(buildJSDocLines(inferred)).toEqual(expected);
    });
  });

  describe('updateJSDocBlock', () => {
    it('should update placeholders but preserve human-written descriptions', () => {
      const existing = [
        'This is a human-written description that should be kept.',
        '@param {string} name - A placeholder description.',
        '@returns {void}',
      ];
      const inferred = {
        description: 'This is an AI description that should be ignored.',
        params: [
          {
            name: 'name',
            type: 'string',
            description: 'The full name of the user.',
          },
        ],
        returns: { type: 'Promise<void>', description: 'No return value.' },
      };

      const result = updateJSDocBlock(existing, inferred);

      expect(result).toContain(
        'This is a human-written description that should be kept.'
      );
      expect(result).toContain(
        '@param {string} name - The full name of the user.'
      );
      expect(result).toContain(
        '@returns {Promise<void>} No return value.'
      );
    });

    it('should add new tags and preserve existing unmanaged tags', () => {
      const existing = [
        'A simple function.',
        '@see https://example.com',
      ];
      const inferred = {
        description: 'A simple function with more details.',
        params: [
          { name: 'id', type: 'number', description: 'The identifier.' },
        ],
      };

      const result = updateJSDocBlock(existing, inferred);

      expect(result).toContain('A simple function.');
      expect(result).toContain('@see https://example.com');
      expect(result).toContain('@param {number} id - The identifier.');
    });

    it('should replace a placeholder description with a new one', () => {
      const existing = ['Description placeholder.'];
      const inferred = {
        description: 'A new, better description.',
        params: [],
      };

      const result = updateJSDocBlock(existing, inferred);
      expect(result).toContain('A new, better description.');
      expect(result).not.toContain('Description placeholder.');
    });
  });
});