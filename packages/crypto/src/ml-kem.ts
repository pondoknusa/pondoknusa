import {
  decapsulate,
  encapsulate,
  generateKemKeyPair,
  encryptWithSharedSecret,
  decryptWithSharedSecret,
} from './backend.js';
import type { EncryptedEnvelope, KemAlgorithm, KemKeyPair, KeyMaterial } from './types.js';

export class MlKem {
  constructor(readonly algorithm: KemAlgorithm) {}

  generateKeyPair(seed?: Uint8Array): KemKeyPair {
    return generateKemKeyPair(this.algorithm, seed) as KemKeyPair;
  }

  encapsulate(publicKey: Uint8Array) {
    return encapsulate(this.algorithm, publicKey);
  }

  decapsulate(ciphertext: Uint8Array, secretKey: Uint8Array): Uint8Array {
    return decapsulate(this.algorithm, ciphertext, secretKey);
  }

  encrypt(plaintext: Uint8Array, recipientPublicKey: Uint8Array): EncryptedEnvelope {
    const { ciphertext: kemCiphertext, sharedSecret } = this.encapsulate(recipientPublicKey);
    const encrypted = encryptWithSharedSecret(sharedSecret, plaintext);
    return {
      version: 1,
      algorithm: this.algorithm,
      backend: 'native',
      kemCiphertext,
      ...encrypted,
    };
  }

  decrypt(envelope: EncryptedEnvelope, secretKey: Uint8Array): Uint8Array {
    assertNativeEnvelope(envelope);
    const sharedSecret = this.decapsulate(envelope.kemCiphertext, secretKey);
    return decryptWithSharedSecret(
      sharedSecret,
      envelope.iv,
      envelope.ciphertext,
      envelope.tag,
    );
  }
}

export function isKemAlgorithm(algorithm: string): algorithm is KemAlgorithm {
  return algorithm === 'ml-kem-512' || algorithm === 'ml-kem-768' || algorithm === 'ml-kem-1024';
}

export function createKemKeyPair(algorithm: KemAlgorithm, seed?: Uint8Array): KeyMaterial {
  return generateKemKeyPair(algorithm, seed);
}

function assertNativeEnvelope(envelope: EncryptedEnvelope): void {
  if (envelope.backend !== 'native') {
    throw new Error(
      `Encrypted envelope backend "${envelope.backend}" is no longer supported. Re-encrypt with Node.js 26+ native PQC.`,
    );
  }
}