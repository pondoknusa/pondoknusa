import {
  nativeDecapsulate,
  nativeEncapsulate,
  nativeGenerateDsaKeyPair,
  nativeGenerateKemKeyPair,
  nativeSign,
  nativeVerify,
  aesGcmDecrypt,
  aesGcmEncrypt,
} from './native-backend.js';
import {
  nativeGenerateHybridKeyPair,
  nativeHybridDecapsulate,
  nativeHybridEncapsulate,
} from './hybrid-backend.js';
import type {
  DsaAlgorithm,
  EncapsulationResult,
  EncryptedEnvelope,
  KemAlgorithm,
  KeyMaterial,
  SlhDsaAlgorithm,
} from './types.js';

export function generateKemKeyPair(algorithm: KemAlgorithm, _seed?: Uint8Array): KeyMaterial {
  return nativeGenerateKemKeyPair(algorithm);
}

export function generateHybridKeyPair(_seed?: Uint8Array): KeyMaterial {
  return nativeGenerateHybridKeyPair(_seed);
}

export function encapsulate(algorithm: KemAlgorithm, publicKey: Uint8Array): EncapsulationResult {
  return nativeEncapsulate(algorithm, publicKey);
}

export function hybridEncapsulate(publicKey: Uint8Array): EncapsulationResult {
  return nativeHybridEncapsulate(publicKey);
}

export function decapsulate(
  algorithm: KemAlgorithm,
  ciphertext: Uint8Array,
  secretKey: Uint8Array,
): Uint8Array {
  return nativeDecapsulate(algorithm, ciphertext, secretKey);
}

export function hybridDecapsulate(ciphertext: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return nativeHybridDecapsulate(ciphertext, secretKey);
}

export function generateDsaKeyPair(algorithm: DsaAlgorithm, _seed?: Uint8Array): KeyMaterial {
  return nativeGenerateDsaKeyPair(algorithm);
}

export function generateSlhDsaKeyPair(algorithm: SlhDsaAlgorithm, _seed?: Uint8Array): KeyMaterial {
  return nativeGenerateDsaKeyPair(algorithm);
}

export function signMessage(
  algorithm: DsaAlgorithm | SlhDsaAlgorithm,
  message: Uint8Array,
  secretKey: Uint8Array,
): Uint8Array {
  return nativeSign(algorithm, message, secretKey);
}

export function verifyMessage(
  algorithm: DsaAlgorithm | SlhDsaAlgorithm,
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): boolean {
  return nativeVerify(algorithm, signature, message, publicKey);
}

export function encryptWithSharedSecret(
  sharedSecret: Uint8Array,
  plaintext: Uint8Array,
  aad?: Uint8Array,
): Pick<EncryptedEnvelope, 'iv' | 'ciphertext' | 'tag'> {
  return aesGcmEncrypt(sharedSecret, plaintext, aad);
}

export function decryptWithSharedSecret(
  sharedSecret: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
  aad?: Uint8Array,
): Uint8Array {
  return aesGcmDecrypt(sharedSecret, iv, ciphertext, tag, aad);
}