// ── Types ───────────────────────────────────────────────────
export type {
  PasskeyConfig,
  PasskeyCredential,
  PasskeyCredentialRepository,
  PasskeyChallengeRecord,
  PasskeyChallengeStore,
  PasskeyCeremony,
  PasskeyUser,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  RegistrationVerified,
  AuthenticationVerified,
  AuthenticatorTransport,
  UserVerificationRequirement,
  AttestationConveyancePreference,
  AuthenticatorAttachment,
  ResidentKeyRequirement,
} from './types.js';

// ── Encoding ────────────────────────────────────────────────
export {
  toBase64Url,
  fromBase64Url,
  randomBase64Url,
  stringToBase64Url,
  base64UrlToString,
} from './base64url.js';

// ── Stores ──────────────────────────────────────────────────
export { MemoryChallengeStore, MemoryCredentialRepository } from './stores.js';

// ── Manager ─────────────────────────────────────────────────
export { PasskeyManager } from './passkey-manager.js';
export { PasskeyError } from './exceptions.js';

// ── Low-level (advanced) ────────────────────────────────────
export { decodeCbor, cborMapGet, CborDecodeError } from './cbor.js';
export { parseAuthenticatorData, parseAttestationObject } from './authenticator-data.js';
export { COSE_ALG_ES256, parseCoseEc2PublicKey, coseBytesToKeyObject } from './cose.js';

// ── Framework integration ───────────────────────────────────
export {
  PasskeyServiceProvider,
  PASSKEY_MANAGER,
  PASSKEY_CONFIG,
  PASSKEY_CREDENTIALS,
  PASSKEY_CHALLENGES,
} from './passkey-service-provider.js';
export { Passkey } from './facade.js';
