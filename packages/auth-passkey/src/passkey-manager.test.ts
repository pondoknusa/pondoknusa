import { createHash, generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { describe, expect, it, beforeEach } from 'vitest';
import { toBase64Url, fromBase64Url, stringToBase64Url } from './base64url.js';
import { decodeCbor } from './cbor.js';
import { PasskeyManager } from './passkey-manager.js';
import { PasskeyError } from './exceptions.js';
import { MemoryChallengeStore, MemoryCredentialRepository } from './stores.js';
import { COSE_ALG_ES256 } from './cose.js';
import type {
  AuthenticationResponseJSON,
  PasskeyConfig,
  RegistrationResponseJSON,
} from './types.js';

const RP_ID = 'localhost';
const ORIGIN = 'http://localhost:3000';

function encodeCbor(value: unknown): Uint8Array {
  // Minimal CBOR encoder for test fixtures only
  if (value === null) return Uint8Array.of(0xf6);
  if (value === true) return Uint8Array.of(0xf5);
  if (value === false) return Uint8Array.of(0xf4);
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0 && value < 24) return Uint8Array.of(value);
    if (Number.isInteger(value) && value >= 0 && value <= 0xff) {
      return Uint8Array.of(0x18, value);
    }
    if (Number.isInteger(value) && value < 0) {
      const n = -1 - value;
      if (n < 24) return Uint8Array.of(0x20 | n);
      if (n <= 0xff) return Uint8Array.of(0x38, n);
    }
  }
  if (value instanceof Uint8Array) {
    if (value.length < 24) {
      return concat(Uint8Array.of(0x40 | value.length), value);
    }
    if (value.length <= 0xff) {
      return concat(Uint8Array.of(0x58, value.length), value);
    }
    return concat(
      Uint8Array.of(0x59, (value.length >> 8) & 0xff, value.length & 0xff),
      value,
    );
  }
  if (typeof value === 'string') {
    const bytes = new TextEncoder().encode(value);
    if (bytes.length < 24) {
      return concat(Uint8Array.of(0x60 | bytes.length), bytes);
    }
    return concat(Uint8Array.of(0x78, bytes.length), bytes);
  }
  if (value instanceof Map) {
    const entries = [...value.entries()];
    const header =
      entries.length < 24
        ? Uint8Array.of(0xa0 | entries.length)
        : Uint8Array.of(0xb8, entries.length);
    let body = header;
    for (const [k, v] of entries) {
      body = concat(body, encodeCbor(k), encodeCbor(v));
    }
    return body;
  }
  if (Array.isArray(value)) {
    const header =
      value.length < 24 ? Uint8Array.of(0x80 | value.length) : Uint8Array.of(0x98, value.length);
    let body = header;
    for (const item of value) body = concat(body, encodeCbor(item));
    return body;
  }
  throw new Error(`Cannot encode CBOR value: ${typeof value}`);
}

function concat(...parts: ArrayLike<number>[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function asU8(bytes: ArrayLike<number>): Uint8Array {
  return Uint8Array.from(bytes);
}

function buildCosePublicKey(x: Uint8Array, y: Uint8Array): Uint8Array {
  const map = new Map<unknown, unknown>([
    [1, 2], // kty: EC2
    [3, COSE_ALG_ES256],
    [-1, 1], // crv: P-256
    [-2, x],
    [-3, y],
  ]);
  return encodeCbor(map);
}

function buildAuthenticatorData(opts: {
  rpId: string;
  signCount: number;
  flags?: number;
  credentialId?: Uint8Array;
  coseKey?: Uint8Array;
}): Uint8Array {
  const rpIdHash = createHash('sha256').update(opts.rpId).digest();
  const flags = opts.flags ?? 0x45; // UP + UV + AT
  const count = Buffer.alloc(4);
  count.writeUInt32BE(opts.signCount);

  let attested = new Uint8Array(0);
  if (opts.credentialId && opts.coseKey) {
    const aaguid = new Uint8Array(16);
    const idLen = Buffer.alloc(2);
    idLen.writeUInt16BE(opts.credentialId.length);
    attested = concat(aaguid, idLen, opts.credentialId, opts.coseKey);
  }

  return concat(asU8(rpIdHash), Uint8Array.of(flags), asU8(count), attested);
}

function clientDataJSON(type: string, challenge: string, origin: string): string {
  const json = JSON.stringify({ type, challenge, origin, crossOrigin: false });
  return toBase64Url(new TextEncoder().encode(json));
}

function jwkXy(publicKeyJwk: JsonWebKey): { x: Uint8Array; y: Uint8Array } {
  return {
    x: fromBase64Url(publicKeyJwk.x!),
    y: fromBase64Url(publicKeyJwk.y!),
  };
}

describe('base64url', () => {
  it('round-trips bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
  });

  it('encodes strings for user ids', () => {
    expect(stringToBase64Url('user-1')).toBe(toBase64Url(new TextEncoder().encode('user-1')));
  });
});

describe('cbor', () => {
  it('decodes maps, bytes, and negative ints', () => {
    const map = new Map<unknown, unknown>([
      [1, 2],
      [3, -7],
      [-2, new Uint8Array([1, 2, 3])],
      ['fmt', 'none'],
    ]);
    const encoded = encodeCbor(map);
    const decoded = decodeCbor(encoded);
    expect(decoded).toBeInstanceOf(Map);
    const m = decoded as Map<unknown, unknown>;
    expect(m.get(1)).toBe(2);
    expect(m.get(3)).toBe(-7);
    expect(m.get('fmt')).toBe('none');
    expect(m.get(-2)).toEqual(new Uint8Array([1, 2, 3]));
  });
});

describe('PasskeyManager', () => {
  let manager: PasskeyManager;
  let credentials: MemoryCredentialRepository;
  let challenges: MemoryChallengeStore;
  let privateKey: import('node:crypto').KeyObject;
  let publicJwk: JsonWebKey;
  let coseKey: Uint8Array;
  let credentialId: Uint8Array;

  const config: PasskeyConfig = {
    rpName: 'Pondoknusa Test',
    rpId: RP_ID,
    origin: ORIGIN,
    userVerification: 'preferred',
    attestation: 'none',
  };

  beforeEach(() => {
    credentials = new MemoryCredentialRepository();
    challenges = new MemoryChallengeStore();
    manager = new PasskeyManager(config, credentials, challenges);

    const pair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    privateKey = pair.privateKey;
    publicJwk = pair.publicKey.export({ format: 'jwk' }) as JsonWebKey;
    const { x, y } = jwkXy(publicJwk);
    coseKey = buildCosePublicKey(x, y);
    credentialId = asU8(createHash('sha256').update('test-cred').digest().subarray(0, 16));
  });

  it('generates registration options with challenge and ES256', async () => {
    const options = await manager.generateRegistrationOptions({
      id: 42,
      name: 'ada@example.com',
      displayName: 'Ada Lovelace',
    });

    expect(options.rp.id).toBe(RP_ID);
    expect(options.rp.name).toBe('Pondoknusa Test');
    expect(options.user.name).toBe('ada@example.com');
    expect(options.challenge.length).toBeGreaterThan(20);
    expect(options.pubKeyCredParams).toEqual([{ type: 'public-key', alg: -7 }]);
    expect(options.attestation).toBe('none');
  });

  it('registers and authenticates a synthetic passkey', async () => {
    const regOptions = await manager.generateRegistrationOptions({
      id: 'user-1',
      name: 'user@example.com',
      displayName: 'User One',
    });

    const authData = buildAuthenticatorData({
      rpId: RP_ID,
      signCount: 0,
      flags: 0x45,
      credentialId,
      coseKey,
    });

    const attestationObject = encodeCbor(
      new Map<unknown, unknown>([
        ['fmt', 'none'],
        ['attStmt', new Map()],
        ['authData', authData],
      ]),
    );

    const registration: RegistrationResponseJSON = {
      id: toBase64Url(credentialId),
      rawId: toBase64Url(credentialId),
      type: 'public-key',
      response: {
        clientDataJSON: clientDataJSON('webauthn.create', regOptions.challenge, ORIGIN),
        attestationObject: toBase64Url(attestationObject),
        transports: ['internal'],
      },
    };

    const { credential } = await manager.verifyRegistration(registration);
    expect(credential.userId).toBe('user-1');
    expect(credential.id).toBe(toBase64Url(credentialId));
    expect(credential.counter).toBe(0);
    expect(credential.transports).toEqual(['internal']);

    // Authentication
    const authOptions = await manager.generateAuthenticationOptions({ userId: 'user-1' });
    expect(authOptions.allowCredentials?.[0]?.id).toBe(credential.id);

    const assertAuthData = buildAuthenticatorData({
      rpId: RP_ID,
      signCount: 1,
      flags: 0x05, // UP + UV
    });

    const clientData = clientDataJSON('webauthn.get', authOptions.challenge, ORIGIN);
    const clientDataHash = createHash('sha256').update(fromBase64Url(clientData)).digest();
    const signed = Buffer.concat([Buffer.from(assertAuthData), clientDataHash]);
    const signature = cryptoSign('sha256', signed, privateKey as import('node:crypto').KeyLike);

    const assertion: AuthenticationResponseJSON = {
      id: credential.id,
      rawId: credential.id,
      type: 'public-key',
      response: {
        clientDataJSON: clientData,
        authenticatorData: toBase64Url(assertAuthData),
        signature: toBase64Url(asU8(signature)),
        userHandle: stringToBase64Url('user-1'),
      },
    };

    const verified = await manager.verifyAuthentication(assertion);
    expect(verified.userId).toBe('user-1');
    expect(verified.newCounter).toBe(1);

    const stored = await credentials.findByCredentialId(credential.id);
    expect(stored?.counter).toBe(1);
  });

  it('rejects wrong origin', async () => {
    const regOptions = await manager.generateRegistrationOptions({
      id: 1,
      name: 'a@b.c',
      displayName: 'A',
    });

    const authData = buildAuthenticatorData({
      rpId: RP_ID,
      signCount: 0,
      credentialId,
      coseKey,
    });
    const attestationObject = encodeCbor(
      new Map<unknown, unknown>([
        ['fmt', 'none'],
        ['attStmt', new Map()],
        ['authData', authData],
      ]),
    );

    const registration: RegistrationResponseJSON = {
      id: toBase64Url(credentialId),
      rawId: toBase64Url(credentialId),
      type: 'public-key',
      response: {
        clientDataJSON: clientDataJSON('webauthn.create', regOptions.challenge, 'https://evil.test'),
        attestationObject: toBase64Url(attestationObject),
      },
    };

    await expect(manager.verifyRegistration(registration)).rejects.toMatchObject({
      code: 'origin_mismatch',
    } satisfies Partial<PasskeyError>);
  });

  it('rejects replayed challenges', async () => {
    const regOptions = await manager.generateRegistrationOptions({
      id: 1,
      name: 'a@b.c',
      displayName: 'A',
    });

    const authData = buildAuthenticatorData({
      rpId: RP_ID,
      signCount: 0,
      credentialId,
      coseKey,
    });
    const attestationObject = encodeCbor(
      new Map<unknown, unknown>([
        ['fmt', 'none'],
        ['attStmt', new Map()],
        ['authData', authData],
      ]),
    );

    const registration: RegistrationResponseJSON = {
      id: toBase64Url(credentialId),
      rawId: toBase64Url(credentialId),
      type: 'public-key',
      response: {
        clientDataJSON: clientDataJSON('webauthn.create', regOptions.challenge, ORIGIN),
        attestationObject: toBase64Url(attestationObject),
      },
    };

    await manager.verifyRegistration(registration);
    await expect(manager.verifyRegistration(registration)).rejects.toMatchObject({
      code: 'challenge_invalid',
    });
  });

  it('rejects counter rollback', async () => {
    const regOptions = await manager.generateRegistrationOptions({
      id: 'u',
      name: 'u@e.c',
      displayName: 'U',
    });

    const authData = buildAuthenticatorData({
      rpId: RP_ID,
      signCount: 5,
      credentialId,
      coseKey,
    });
    const attestationObject = encodeCbor(
      new Map<unknown, unknown>([
        ['fmt', 'none'],
        ['attStmt', new Map()],
        ['authData', authData],
      ]),
    );

    await manager.verifyRegistration({
      id: toBase64Url(credentialId),
      rawId: toBase64Url(credentialId),
      type: 'public-key',
      response: {
        clientDataJSON: clientDataJSON('webauthn.create', regOptions.challenge, ORIGIN),
        attestationObject: toBase64Url(attestationObject),
      },
    });

    const authOptions = await manager.generateAuthenticationOptions({ userId: 'u' });
    const assertAuthData = buildAuthenticatorData({
      rpId: RP_ID,
      signCount: 5,
      flags: 0x05,
    });
    const clientData = clientDataJSON('webauthn.get', authOptions.challenge, ORIGIN);
    const clientDataHash = createHash('sha256').update(fromBase64Url(clientData)).digest();
    const signed = Buffer.concat([Buffer.from(assertAuthData), clientDataHash]);
    const signature = cryptoSign('sha256', signed, privateKey as import('node:crypto').KeyLike);

    await expect(
      manager.verifyAuthentication({
        id: toBase64Url(credentialId),
        rawId: toBase64Url(credentialId),
        type: 'public-key',
        response: {
          clientDataJSON: clientData,
          authenticatorData: toBase64Url(assertAuthData),
          signature: toBase64Url(asU8(signature)),
        },
      }),
    ).rejects.toMatchObject({ code: 'counter_invalid' });
  });
});
