import { randomInt } from 'node:crypto';

const ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const SHORT_CODE_LENGTH = 7;

/**
 * Cryptographically random base62 code. 62^7 ≈ 3.5 trillion combinations,
 * so collisions are rare but still handled by the caller via the unique index.
 * Random (rather than derived from the row id) so codes can't be enumerated.
 */
export function generateShortCode(length = SHORT_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
