import * as nodeCrypto from 'node:crypto';
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  randomBytes,
  type KeyObject,
} from 'node:crypto';
import type { EncapsulationResult, KeyMaterial } from './types.js';

const ML_KEM_PUBLIC_KEY_LEN = 1184;
const X25519_PUBLIC_KEY_LEN = 32;
const ML_KEM_CIPHERTEXT_LEN = 1088;
const ML_KEM_PRIVATE_KEY_LEN = 86;
const X25519_PRIVATE_KEY_LEN = 48;
const HYBRID_DOMAIN_LABEL = Buffer.from('\\.//^\\', 'ascii');

export const HYBRID_PUBLIC_KEY_LEN = ML_KEM_PUBLIC_KEY_LEN + X25519_PUBLIC_KEY_LEN;
export const HYBRID_SECRET_KEY_LEN = ML_KEM_PRIVATE_KEY_LEN + X25519_PRIVATE_KEY_LEN;
export const HYBRID_CIPHERTEXT_LEN = ML_KEM_CIPHERTEXT_LEN + X25519_PUBLIC_KEY_LEN;

type NativeEncapsulationResult = {
  ciphertext: Buffer;
  sharedKey: Buffer;
};

type HybridKeyParts = {
  mlKem: { publicKey: Uint8Array; privateKey: KeyObject };
  x25519: { publicKey: Uint8Array; privateKey: KeyObject };
};

function combineHybridSharedSecret(
  mlKemSharedSecret: Uint8Array,
  x25519SharedSecret: Uint8Array,
  x25519Ciphertext: Uint8Array,
  x25519PublicKey: Uint8Array,
): Uint8Array {
  const preimage = Buffer.concat([
    Buffer.from(mlKemSharedSecret),
    Buffer.from(x25519SharedSecret),
    Buffer.from(x25519Ciphertext),
    Buffer.from(x25519PublicKey),
    HYBRID_DOMAIN_LABEL,
  ]);
  return new Uint8Array(createHash('sha3-256').update(preimage).digest());
}

function importMlKem768PublicKey(rawPublicKey: Uint8Array): KeyObject {
  return createPublicKey({
    key: {
      kty: 'AKP',
      alg: 'ML-KEM-768',
      pub: Buffer.from(rawPublicKey).toString('base64url'),
    } as never,
    format: 'jwk',
  });
}

function importX25519PublicKey(rawPublicKey: Uint8Array): KeyObject {
  return createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: Buffer.from(rawPublicKey).toString('base64url'),
    },
    format: 'jwk',
  });
}

function generateHybridKeyParts(): HybridKeyParts {
  const mlKemPair = generateKeyPairSync('ml-kem-768' as never) as {
    publicKey: KeyObject;
    privateKey: KeyObject;
  };
  const x25519Pair = generateKeyPairSync('x25519' as never) as {
    publicKey: KeyObject;
    privateKey: KeyObject;
  };

  return {
    mlKem: {
      publicKey: new Uint8Array(mlKemPair.publicKey.export({ format: 'raw-public' })),
      privateKey: mlKemPair.privateKey,
    },
    x25519: {
      publicKey: new Uint8Array(x25519Pair.publicKey.export({ format: 'raw-public' })),
      privateKey: x25519Pair.privateKey,
    },
  };
}

function packHybridSecretKey(parts: HybridKeyParts): Uint8Array {
  const secretKey = new Uint8Array(HYBRID_SECRET_KEY_LEN);
  secretKey.set(
    new Uint8Array(parts.mlKem.privateKey.export({ format: 'der', type: 'pkcs8' })),
    0,
  );
  secretKey.set(
    new Uint8Array(parts.x25519.privateKey.export({ format: 'der', type: 'pkcs8' })),
    ML_KEM_PRIVATE_KEY_LEN,
  );
  return secretKey;
}

function unpackHybridSecretKey(secretKey: Uint8Array): HybridKeyParts {
  const mlKemPrivateDer = secretKey.subarray(0, ML_KEM_PRIVATE_KEY_LEN);
  const x25519PrivateDer = secretKey.subarray(ML_KEM_PRIVATE_KEY_LEN, HYBRID_SECRET_KEY_LEN);
  const mlKemPrivateKey = createPrivateKey({
    key: Buffer.from(mlKemPrivateDer),
    format: 'der',
    type: 'pkcs8',
  });
  const x25519PrivateKey = createPrivateKey({
    key: Buffer.from(x25519PrivateDer),
    format: 'der',
    type: 'pkcs8',
  });

  const mlKemPublicKey = createPublicKey(mlKemPrivateKey as never);
  const x25519PublicKey = createPublicKey(x25519PrivateKey as never);

  return {
    mlKem: {
      publicKey: new Uint8Array(mlKemPublicKey.export({ format: 'raw-public' })),
      privateKey: mlKemPrivateKey,
    },
    x25519: {
      publicKey: new Uint8Array(x25519PublicKey.export({ format: 'raw-public' })),
      privateKey: x25519PrivateKey,
    },
  };
}

function encapsulateKeyObject(publicKey: KeyObject): NativeEncapsulationResult {
  const encapsulate = (nodeCrypto as { encapsulate: (key: KeyObject) => NativeEncapsulationResult })
    .encapsulate;
  return encapsulate(publicKey);
}

function decapsulateKeyObject(privateKey: KeyObject, ciphertext: Uint8Array): Buffer {
  const decapsulate = (nodeCrypto as {
    decapsulate: (key: KeyObject, ciphertext: Buffer) => Buffer;
  }).decapsulate;
  return decapsulate(privateKey, Buffer.from(ciphertext));
}

export function supportsNativeHybridKem(): boolean {
  try {
    const keys = nativeGenerateHybridKeyPair();
    const encapsulated = nativeHybridEncapsulate(keys.publicKey);
    const sharedSecret = nativeHybridDecapsulate(encapsulated.ciphertext, keys.secretKey);
    return sharedSecret.length === 32;
  } catch {
    return false;
  }
}

export function nativeGenerateHybridKeyPair(_seed?: Uint8Array): KeyMaterial {
  const parts = generateHybridKeyParts();
  const publicKey = new Uint8Array(HYBRID_PUBLIC_KEY_LEN);
  publicKey.set(parts.mlKem.publicKey, 0);
  publicKey.set(parts.x25519.publicKey, ML_KEM_PUBLIC_KEY_LEN);

  return {
    algorithm: 'hybrid-x25519-ml-kem-768',
    publicKey,
    secretKey: packHybridSecretKey(parts),
  };
}

export function nativeHybridEncapsulate(publicKey: Uint8Array): EncapsulationResult {
  const mlKemPublicKey = publicKey.subarray(0, ML_KEM_PUBLIC_KEY_LEN);
  const x25519PublicKey = publicKey.subarray(ML_KEM_PUBLIC_KEY_LEN);

  const mlKemResult = encapsulateKeyObject(importMlKem768PublicKey(mlKemPublicKey));
  const ephemeral = generateKeyPairSync('x25519' as never) as {
    publicKey: KeyObject;
    privateKey: KeyObject;
  };
  const x25519Ciphertext = new Uint8Array(
    ephemeral.publicKey.export({ format: 'raw-public' }),
  );
  const x25519SharedSecret = new Uint8Array(
    diffieHellman({
      privateKey: ephemeral.privateKey,
      publicKey: importX25519PublicKey(x25519PublicKey),
    }),
  );

  const ciphertext = new Uint8Array(HYBRID_CIPHERTEXT_LEN);
  ciphertext.set(mlKemResult.ciphertext, 0);
  ciphertext.set(x25519Ciphertext, ML_KEM_CIPHERTEXT_LEN);

  return {
    ciphertext,
    sharedSecret: combineHybridSharedSecret(
      mlKemResult.sharedKey,
      x25519SharedSecret,
      x25519Ciphertext,
      x25519PublicKey,
    ),
  };
}

export function nativeHybridDecapsulate(ciphertext: Uint8Array, secretKey: Uint8Array): Uint8Array {
  const { mlKem, x25519 } = unpackHybridSecretKey(secretKey);
  const mlKemCiphertext = ciphertext.subarray(0, ML_KEM_CIPHERTEXT_LEN);
  const x25519Ciphertext = ciphertext.subarray(ML_KEM_CIPHERTEXT_LEN);

  const mlKemSharedSecret = decapsulateKeyObject(mlKem.privateKey, mlKemCiphertext);
  const x25519SharedSecret = new Uint8Array(
    diffieHellman({
      privateKey: x25519.privateKey,
      publicKey: importX25519PublicKey(x25519Ciphertext),
    }),
  );

  return combineHybridSharedSecret(
    mlKemSharedSecret,
    x25519SharedSecret,
    x25519Ciphertext,
    x25519.publicKey,
  );
}