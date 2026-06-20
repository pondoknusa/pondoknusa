import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;

export class Hasher {
  make(plain: string): string {
    const salt = randomBytes(16);
    const hash = scryptSync(plain, salt, KEY_LENGTH, SCRYPT_PARAMS);
    return `scrypt:${salt.toString('base64url')}:${hash.toString('base64url')}`;
  }

  check(plain: string, hashed: string): boolean {
    if (!hashed.startsWith('scrypt:')) {
      return false;
    }

    const parts = hashed.split(':');
    const salt = parts[1];
    const digest = parts[2];
    if (!salt || !digest) {
      return false;
    }

    const expected = Buffer.from(digest, 'base64url');
    const actual = scryptSync(
      plain,
      Buffer.from(salt, 'base64url'),
      expected.length,
      SCRYPT_PARAMS,
    );

    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(expected, actual);
  }
}