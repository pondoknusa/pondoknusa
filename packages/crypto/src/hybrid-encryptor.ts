import {
  decryptWithSharedSecret,
  encryptWithSharedSecret,
  generateHybridKeyPair,
  hybridDecapsulate,
  hybridEncapsulate,
} from './backend.js';
import type { EncryptedEnvelope, HybridAlgorithm, KemKeyPair } from './types.js';

export class HybridEncryptor {
  readonly algorithm: HybridAlgorithm = 'hybrid-x25519-ml-kem-768';

  generateKeyPair(seed?: Uint8Array): KemKeyPair {
    return generateHybridKeyPair(seed) as KemKeyPair;
  }

  encapsulate(publicKey: Uint8Array) {
    return hybridEncapsulate(publicKey);
  }

  decapsulate(ciphertext: Uint8Array, secretKey: Uint8Array): Uint8Array {
    return hybridDecapsulate(ciphertext, secretKey);
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
    if (envelope.backend !== 'native') {
      throw new Error(
        `Encrypted envelope backend "${envelope.backend}" is no longer supported. Re-encrypt with Node.js 26+ native PQC.`,
      );
    }
    const sharedSecret = this.decapsulate(envelope.kemCiphertext, secretKey);
    return decryptWithSharedSecret(
      sharedSecret,
      envelope.iv,
      envelope.ciphertext,
      envelope.tag,
    );
  }
}

export function isHybridAlgorithm(algorithm: string): algorithm is HybridAlgorithm {
  return algorithm === 'hybrid-x25519-ml-kem-768';
}