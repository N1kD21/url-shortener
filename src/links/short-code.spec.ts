import { generateShortCode, SHORT_CODE_LENGTH } from './short-code';

describe('generateShortCode', () => {
  it('returns a base62 string of the default length', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(SHORT_CODE_LENGTH);
    expect(code).toMatch(/^[0-9A-Za-z]+$/);
  });

  it('respects a custom length', () => {
    expect(generateShortCode(12)).toHaveLength(12);
  });

  it('does not repeat itself in a reasonable sample', () => {
    const codes = new Set(
      Array.from({ length: 1000 }, () => generateShortCode()),
    );
    expect(codes.size).toBe(1000);
  });
});
