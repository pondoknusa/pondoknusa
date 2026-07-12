/**
 * Minimal CBOR decoder for WebAuthn attestation objects and COSE keys.
 * Only decodes the major types WebAuthn actually needs.
 */

export type CborValue =
  | number
  | bigint
  | string
  | Uint8Array
  | boolean
  | null
  | CborValue[]
  | Map<CborValue, CborValue>;

export class CborDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CborDecodeError';
  }
}

const MAX_CBOR_DEPTH = 64;

export function decodeCbor(data: Uint8Array, maxDepth = MAX_CBOR_DEPTH): CborValue {
  const reader = new CborReader(data, maxDepth);
  const value = reader.read(0);
  return value;
}

export function cborMapGet(map: Map<CborValue, CborValue>, key: CborValue): CborValue | undefined {
  if (map.has(key)) {
    return map.get(key);
  }
  // Numeric keys may arrive as bigint depending on size; tolerate both.
  if (typeof key === 'number') {
    for (const [k, v] of map) {
      if (typeof k === 'number' && k === key) return v;
      if (typeof k === 'bigint' && Number(k) === key) return v;
    }
  }
  return undefined;
}

class CborReader {
  private offset = 0;

  constructor(
    private readonly data: Uint8Array,
    private readonly maxDepth: number,
  ) {}

  read(depth: number): CborValue {
    if (depth > this.maxDepth) {
      throw new CborDecodeError('CBOR depth limit exceeded');
    }

    if (this.offset >= this.data.length) {
      throw new CborDecodeError('Unexpected end of CBOR data');
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
        const bytes = this.readBytes(length);
        return new TextDecoder().decode(bytes);
      }
      case 4: {
        const length = this.readLength(additional);
        const arr: CborValue[] = [];
        for (let i = 0; i < length; i++) {
          arr.push(this.read(depth + 1));
        }
        return arr;
      }
      case 5: {
        const length = this.readLength(additional);
        const map = new Map<CborValue, CborValue>();
        for (let i = 0; i < length; i++) {
          const key = this.read(depth + 1);
          const value = this.read(depth + 1);
          map.set(key, value);
        }
        return map;
      }
      case 7:
        return this.readSimple(additional);
      default:
        throw new CborDecodeError(`Unsupported CBOR major type ${major}`);
    }
  }

  private readUint(additional: number): number | bigint {
    if (additional < 24) return additional;
    if (additional === 24) return this.readExact(1)[0]!;
    if (additional === 25) {
      const b = this.readExact(2);
      return (b[0]! << 8) | b[1]!;
    }
    if (additional === 26) {
      const b = this.readExact(4);
      return ((b[0]! << 24) | (b[1]! << 16) | (b[2]! << 8) | b[3]!) >>> 0;
    }
    if (additional === 27) {
      const b = this.readExact(8);
      let value = 0n;
      for (const byte of b) {
        value = (value << 8n) | BigInt(byte);
      }
      if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
        return Number(value);
      }
      return value;
    }
    throw new CborDecodeError(`Unsupported CBOR additional info ${additional}`);
  }

  private readLength(additional: number): number {
    const value = this.readUint(additional);
    if (typeof value === 'bigint') {
      throw new CborDecodeError('CBOR length too large');
    }
    return value;
  }

  private readBytes(length: number): Uint8Array {
    if (this.offset + length > this.data.length) {
      throw new CborDecodeError('Unexpected end of CBOR byte string');
    }
    const slice = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  private readExact(length: number): Uint8Array {
    return this.readBytes(length);
  }

  private readSimple(additional: number): CborValue {
    if (additional === 20) return false;
    if (additional === 21) return true;
    if (additional === 22) return null;
    if (additional === 23) return null; // undefined treated as null
    if (additional === 24) {
      this.readExact(1);
      throw new CborDecodeError('Simple value not supported');
    }
    if (additional === 25 || additional === 26 || additional === 27) {
      // Skip float payloads — WebAuthn does not need them
      const sizes = { 25: 2, 26: 4, 27: 8 } as const;
      this.readExact(sizes[additional as 25 | 26 | 27]);
      throw new CborDecodeError('Floating point CBOR values are not supported');
    }
    throw new CborDecodeError(`Unsupported CBOR simple value ${additional}`);
  }
}
