/**
 * WebAuthn authenticatorData binary parser.
 * Spec: https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data
 */

import { decodeCbor, cborMapGet, type CborValue } from './cbor.js';

export interface AuthenticatorData {
  rpIdHash: Uint8Array;
  flags: number;
  signCount: number;
  userPresent: boolean;
  userVerified: boolean;
  attestedCredentialDataIncluded: boolean;
  extensionDataIncluded: boolean;
  attestedCredentialData?: AttestedCredentialData;
  raw: Uint8Array;
}

export interface AttestedCredentialData {
  aaguid: Uint8Array;
  credentialId: Uint8Array;
  credentialPublicKey: Uint8Array;
}

export function parseAuthenticatorData(data: Uint8Array): AuthenticatorData {
  if (data.length < 37) {
    throw new Error('authenticatorData is too short');
  }

  const rpIdHash = data.subarray(0, 32);
  const flags = data[32]!;
  const signCount =
    ((data[33]! << 24) | (data[34]! << 16) | (data[35]! << 8) | data[36]!) >>> 0;

  const userPresent = (flags & 0x01) !== 0;
  const userVerified = (flags & 0x04) !== 0;
  const attestedCredentialDataIncluded = (flags & 0x40) !== 0;
  const extensionDataIncluded = (flags & 0x80) !== 0;

  let offset = 37;
  let attestedCredentialData: AttestedCredentialData | undefined;

  if (attestedCredentialDataIncluded) {
    if (data.length < offset + 18) {
      throw new Error('authenticatorData missing attested credential data');
    }
    const aaguid = data.subarray(offset, offset + 16);
    offset += 16;
    const credIdLen = ((data[offset]! << 8) | data[offset + 1]!) >>> 0;
    offset += 2;
    if (data.length < offset + credIdLen) {
      throw new Error('authenticatorData credential id length exceeds buffer');
    }
    const credentialId = data.subarray(offset, offset + credIdLen);
    offset += credIdLen;

    // credentialPublicKey is a CBOR map; decode to find its end by re-encoding length via reader
    const remaining = data.subarray(offset);
    const { value: coseKey, bytesRead } = decodeCborWithLength(remaining);
    if (!(coseKey instanceof Map)) {
      throw new Error('credentialPublicKey must be a CBOR map');
    }
    const credentialPublicKey = remaining.subarray(0, bytesRead);
    offset += bytesRead;

    attestedCredentialData = { aaguid, credentialId, credentialPublicKey };
  }

  if (extensionDataIncluded) {
    // Skip extensions map; not used for verification beyond length checks
    const remaining = data.subarray(offset);
    if (remaining.length > 0) {
      decodeCborWithLength(remaining);
    }
  }

  return {
    rpIdHash,
    flags,
    signCount,
    userPresent,
    userVerified,
    attestedCredentialDataIncluded,
    extensionDataIncluded,
    attestedCredentialData,
    raw: data,
  };
}

export function parseAttestationObject(attestationObject: Uint8Array): {
  fmt: string;
  authData: Uint8Array;
  attStmt: Map<CborValue, CborValue>;
} {
  const decoded = decodeCbor(attestationObject);
  if (!(decoded instanceof Map)) {
    throw new Error('attestationObject must be a CBOR map');
  }

  const fmt = cborMapGet(decoded, 'fmt');
  const authData = cborMapGet(decoded, 'authData');
  const attStmt = cborMapGet(decoded, 'attStmt');

  if (typeof fmt !== 'string') {
    throw new Error('attestationObject.fmt must be a string');
  }
  if (!(authData instanceof Uint8Array)) {
    throw new Error('attestationObject.authData must be bytes');
  }
  if (!(attStmt instanceof Map)) {
    throw new Error('attestationObject.attStmt must be a map');
  }

  return { fmt, authData, attStmt };
}

/**
 * Decode one CBOR value and report how many bytes it consumed.
 * Uses a secondary walk of the same buffer via a length-aware reader.
 */
function decodeCborWithLength(data: Uint8Array): { value: CborValue; bytesRead: number } {
  const reader = new LengthAwareCborReader(data);
  const value = reader.read();
  return { value, bytesRead: reader.bytesRead };
}

class LengthAwareCborReader {
  private offset = 0;
  constructor(private readonly data: Uint8Array) {}

  get bytesRead(): number {
    return this.offset;
  }

  read(): CborValue {
    if (this.offset >= this.data.length) {
      throw new Error('Unexpected end of CBOR data');
    }
    const initial = this.data[this.offset]!;
    const major = initial >> 5;
    const additional = initial & 0x1f;
    this.offset += 1;

    switch (major) {
      case 0:
        return this.readUint(additional);
      case 1: {
        const n = this.readUint(additional);
        return typeof n === 'bigint' ? -n - 1n : -1 - n;
      }
      case 2: {
        const length = this.readLength(additional);
        return this.readBytes(length);
      }
      case 3: {
        const length = this.readLength(additional);
        return new TextDecoder().decode(this.readBytes(length));
      }
      case 4: {
        const length = this.readLength(additional);
        const arr: CborValue[] = [];
        for (let i = 0; i < length; i++) arr.push(this.read());
        return arr;
      }
      case 5: {
        const length = this.readLength(additional);
        const map = new Map<CborValue, CborValue>();
        for (let i = 0; i < length; i++) {
          map.set(this.read(), this.read());
        }
        return map;
      }
      case 7:
        return this.readSimple(additional);
      default:
        throw new Error(`Unsupported CBOR major type ${major}`);
    }
  }

  private readUint(additional: number): number | bigint {
    if (additional < 24) return additional;
    if (additional === 24) return this.readBytes(1)[0]!;
    if (additional === 25) {
      const b = this.readBytes(2);
      return (b[0]! << 8) | b[1]!;
    }
    if (additional === 26) {
      const b = this.readBytes(4);
      return ((b[0]! << 24) | (b[1]! << 16) | (b[2]! << 8) | b[3]!) >>> 0;
    }
    if (additional === 27) {
      const b = this.readBytes(8);
      let value = 0n;
      for (const byte of b) value = (value << 8n) | BigInt(byte);
      if (value <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(value);
      return value;
    }
    throw new Error(`Unsupported CBOR additional info ${additional}`);
  }

  private readLength(additional: number): number {
    const value = this.readUint(additional);
    if (typeof value === 'bigint') throw new Error('CBOR length too large');
    return value;
  }

  private readBytes(length: number): Uint8Array {
    if (this.offset + length > this.data.length) {
      throw new Error('Unexpected end of CBOR data');
    }
    const slice = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  private readSimple(additional: number): CborValue {
    if (additional === 20) return false;
    if (additional === 21) return true;
    if (additional === 22 || additional === 23) return null;
    if (additional === 25) {
      this.readBytes(2);
      return 0;
    }
    if (additional === 26) {
      this.readBytes(4);
      return 0;
    }
    if (additional === 27) {
      this.readBytes(8);
      return 0;
    }
    throw new Error(`Unsupported CBOR simple value ${additional}`);
  }
}
