/**
 * COSE key helpers for ES256 (P-256) public keys used by WebAuthn.
 */

import { createPublicKey, type KeyObject } from 'node:crypto';
import { CborDecodeError, cborMapGet, decodeCbor, type CborValue } from './cbor.js';
import { toBase64Url } from './base64url.js';

/** COSE algorithm identifier for ECDSA w/ SHA-256 */
export const COSE_ALG_ES256 = -7;

/** COSE key type EC2 (RFC 8152 Table 9) */
const COSE_KEY_TYPE_EC2 = 2;
/** COSE EC2 curve P-256 */
const COSE_CRV_P256 = 1;

export interface CoseEc2PublicKey {
  x: Uint8Array;
  y: Uint8Array;
  alg: number;
}

export function parseCoseEc2PublicKey(coseBytes: Uint8Array): CoseEc2PublicKey {
  const decoded = decodeCbor(coseBytes);
  if (!(decoded instanceof Map)) {
    throw new CborDecodeError('COSE key must be a CBOR map');
  }

  const kty = asNumber(cborMapGet(decoded, 1), 'kty');
  if (kty !== COSE_KEY_TYPE_EC2) {
    throw new Error(`Unsupported COSE key type ${kty}; only EC2 (2) is supported`);
  }

  const alg = asNumber(cborMapGet(decoded, 3) ?? COSE_ALG_ES256, 'alg');
  if (alg !== COSE_ALG_ES256) {
    throw new Error(`Unsupported COSE algorithm ${alg}; only ES256 (-7) is supported`);
  }

  const crv = asNumber(cborMapGet(decoded, -1), 'crv');
  if (crv !== COSE_CRV_P256) {
    throw new Error(`Unsupported COSE curve ${crv}; only P-256 (1) is supported`);
  }

  const x = asBytes(cborMapGet(decoded, -2), 'x');
  const y = asBytes(cborMapGet(decoded, -3), 'y');

  if (x.length !== 32 || y.length !== 32) {
    throw new Error('Invalid P-256 public key coordinates');
  }

  return { x, y, alg };
}

export function coseEc2ToKeyObject(key: CoseEc2PublicKey): KeyObject {
  return createPublicKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: toBase64Url(key.x),
      y: toBase64Url(key.y),
    },
    format: 'jwk',
  });
}

export function coseBytesToKeyObject(coseBytes: Uint8Array): KeyObject {
  return coseEc2ToKeyObject(parseCoseEc2PublicKey(coseBytes));
}

function asNumber(value: CborValue | undefined, label: string): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  throw new Error(`COSE key missing numeric field "${label}"`);
}

function asBytes(value: CborValue | undefined, label: string): Uint8Array {
  if (value instanceof Uint8Array) return value;
  throw new Error(`COSE key missing byte field "${label}"`);
}
