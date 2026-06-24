import { generateSlhDsaKeyPair, signMessage, verifyMessage } from './backend.js';
import type { DsaKeyPair, SlhDsaAlgorithm } from './types.js';

export class SlhDsa {
  constructor(readonly algorithm: SlhDsaAlgorithm) {}

  generateKeyPair(seed?: Uint8Array): DsaKeyPair {
    return generateSlhDsaKeyPair(this.algorithm, seed) as DsaKeyPair;
  }

  sign(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
    return signMessage(this.algorithm, message, secretKey);
  }

  verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
    return verifyMessage(this.algorithm, signature, message, publicKey);
  }
}

export function isSlhDsaAlgorithm(algorithm: string): algorithm is SlhDsaAlgorithm {
  return algorithm.startsWith('slh-dsa-');
}