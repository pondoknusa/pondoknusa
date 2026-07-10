/**
 * @pondoknusa/telegram-2fa — Secure code generator.
 *
 * Generates cryptographically random numeric codes and hashes them
 * with SHA-256 so plaintext codes are never stored.
 */

import { randomInt, createHash } from 'node:crypto';

export interface CodePair {
  /** Plaintext code — sent to the user, never stored */
  plaintext: string;
  /** SHA-256 hex digest — stored in cache for verification */
  hashed: string;
}

/**
 * Generate a cryptographically random numeric code.
 * @param length Number of digits (default: 6)
 */
export function generateCode(length: number = 6): CodePair {
  const digits: string[] = [];
  for (let i = 0; i < length; i++) {
    digits.push(String(randomInt(0, 10)));
  }
  const plaintext = digits.join('');
  return {
    plaintext,
    hashed: hashCode(plaintext),
  };
}

/**
 * Hash a plaintext code with SHA-256.
 */
export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/**
 * Constant-time comparison to prevent timing attacks.
 * Returns true if both strings are identical.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare a dummy length to avoid leaking the actual length
    const dummy = createHash('sha256').update('').digest();
    createHash('sha256').update(a).digest(); // still consume a
    createHash('sha256').update(b).digest(); // still consume b
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}