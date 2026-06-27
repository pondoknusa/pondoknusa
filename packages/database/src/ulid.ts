import { randomBytes } from 'node:crypto';

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateUlid(): string {
  return encodeTime(Date.now()) + encodeRandom(randomBytes(16));
}

function encodeTime(time: number): string {
  let value = time;
  let output = '';

  for (let index = 0; index < 10; index += 1) {
    output = ENCODING[value % 32]! + output;
    value = Math.floor(value / 32);
  }

  return output;
}

function encodeRandom(bytes: Uint8Array): string {
  let output = '';

  for (const byte of bytes) {
    output += ENCODING[byte % 32]!;
  }

  return output;
}