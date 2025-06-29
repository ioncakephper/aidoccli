const normalizeString = require('./normalize-string');

describe('normalizeString', () => {
  test('should convert a basic string with spaces to kebab-case', () => {
    expect(normalizeString('Hello World')).toBe('hello-world');
  });

  test('should trim leading and trailing whitespace', () => {
    expect(normalizeString('  leading and trailing  ')).toBe(
      'leading-and-trailing'
    );
  });

  test('should convert the entire string to lowercase', () => {
    expect(normalizeString('UPPERCASE STRING')).toBe('uppercase-string');
  });

  test('should replace various special characters with a dash', () => {
    expect(normalizeString('a!b@c#d$e%f^g&h*i(j)k')).toBe(
      'a-b-c-d-e-f-g-h-i-j-k'
    );
  });

  test('should collapse multiple dashes and spaces into a single dash', () => {
    expect(normalizeString('multiple---dashes')).toBe('multiple-dashes');
    expect(normalizeString('a  b   c')).toBe('a-b-c');
  });

  test('should remove leading and trailing dashes', () => {
    expect(normalizeString('-leading-and-trailing-')).toBe(
      'leading-and-trailing'
    );
  });

  test('should handle a complex mix of operations correctly', () => {
    expect(normalizeString('  --My Awesome Post #1!  --')).toBe(
      'my-awesome-post-1'
    );
  });

  test('should return an empty string if the input is an empty string', () => {
    expect(normalizeString('')).toBe('');
  });

  test('should throw an error for null or undefined input', () => {
    expect(() => normalizeString(null)).toThrow(
      'Input cannot be null or undefined.'
    );
    expect(() => normalizeString(undefined)).toThrow(
      'Input cannot be null or undefined.'
    );
  });
});
