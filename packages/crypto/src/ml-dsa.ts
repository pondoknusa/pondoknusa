import { generateDsaKeyPair, signMessage, verifyMessage } from './backend.js';
import type { DsaAlgorithm, DsaKeyPair } from './types.js';

export class MlDsa {
  constructor(readonly algorithm: DsaAlgorithm) {}

  generateKeyPair(seed?: Uint8Array): DsaKeyPair {
    return generateDsaKeyPair(this.algorithm, seed) as DsaKeyPair;
  }

  sign(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
    return signMessage(this.algorithm, message, secretKey);
  }

  verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
    return verifyMessage(this.algorithm, signature, message, publicKey);
  }
}

export function isMlDsaAlgorithm(algorithm: string): algorithm is DsaAlgorithm {
  return algorithm === 'ml-dsa-44' || algorithm === 'ml-dsa-65' || algorithm === 'ml-dsa-87';
}