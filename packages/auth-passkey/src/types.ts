/**
 * @pondoknusa/auth-passkey — Type definitions.
 *
 * Experimental. JSON shapes follow the WebAuthn Level 2 / Level 3
 * "JSON serialization" used by browsers and relying parties.
 */

// ── Config ──────────────────────────────────────────────────

export interface PasskeyConfig {
  /** Relying party display name (shown by the authenticator UI). */
  rpName: string;
  /** Relying party ID (effective domain, e.g. `example.com`). */
  rpId: string;
  /** Expected origin(s) for clientDataJSON.origin checks. */
  origin: string | string[];
  /** Challenge lifetime in seconds. Default: 300 */
  challengeTtlSeconds?: number;
  /** WebAuthn ceremony timeout in ms. Default: 60000 */
  timeoutMs?: number;
  /** Default user verification preference. Default: `preferred` */
  userVerification?: UserVerificationRequirement;
  /** Attestation conveyance. Default: `none` */
  attestation?: AttestationConveyancePreference;
  /** Preferred authenticator attachment. Default: undefined (any) */
  authenticatorAttachment?: AuthenticatorAttachment;
  /** Whether to require a resident/discoverable credential. Default: `preferred` */
  residentKey?: ResidentKeyRequirement;
}

// ── Credential storage ──────────────────────────────────────

export interface PasskeyCredential {
  /** Base64url credential ID. */
  id: string;
  /** Application user identifier. */
  userId: string | number;
  /** COSE public key bytes (EC2 / ES256). */
  publicKey: Uint8Array;
  /** Signature counter from the last successful authentication. */
  counter: number;
  /** Optional authenticator transports. */
  transports?: AuthenticatorTransport[];
  /** Optional human label (device name). */
  label?: string;
  /** Unix ms when the credential was registered. */
  createdAt: number;
}

export interface PasskeyCredentialRepository {
  findByCredentialId(id: string): Promise<PasskeyCredential | null>;
  findByUserId(userId: string | number): Promise<PasskeyCredential[]>;
  save(credential: PasskeyCredential): Promise<void>;
  updateCounter(id: string, counter: number): Promise<void>;
  delete(id: string): Promise<void>;
}

// ── Challenges ──────────────────────────────────────────────

export type PasskeyCeremony = 'registration' | 'authentication';

export interface PasskeyChallengeRecord {
  challenge: string;
  ceremony: PasskeyCeremony;
  userId?: string | number;
  expiresAt: number;
}

export interface PasskeyChallengeStore {
  put(record: PasskeyChallengeRecord): Promise<void>;
  take(challenge: string): Promise<PasskeyChallengeRecord | null>;
}

// ── Users ───────────────────────────────────────────────────

export interface PasskeyUser {
  id: string | number;
  name: string;
  displayName: string;
}

// ── JSON WebAuthn options / responses ───────────────────────

export type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged';
export type AttestationConveyancePreference = 'none' | 'indirect' | 'direct' | 'enterprise';
export type AuthenticatorAttachment = 'platform' | 'cross-platform';
export type ResidentKeyRequirement = 'discouraged' | 'preferred' | 'required';
export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid' | 'smart-card';
export type PublicKeyCredentialType = 'public-key';
export type COSEAlgorithmIdentifier = number;

export interface PublicKeyCredentialRpEntity {
  id?: string;
  name: string;
}

export interface PublicKeyCredentialUserEntityJSON {
  id: string;
  name: string;
  displayName: string;
}

export interface PublicKeyCredentialParameters {
  type: PublicKeyCredentialType;
  alg: COSEAlgorithmIdentifier;
}

export interface PublicKeyCredentialDescriptorJSON {
  type: PublicKeyCredentialType;
  id: string;
  transports?: AuthenticatorTransport[];
}

export interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: AuthenticatorAttachment;
  residentKey?: ResidentKeyRequirement;
  requireResidentKey?: boolean;
  userVerification?: UserVerificationRequirement;
}

export interface PublicKeyCredentialCreationOptionsJSON {
  rp: PublicKeyCredentialRpEntity;
  user: PublicKeyCredentialUserEntityJSON;
  challenge: string;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptorJSON[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface AuthenticatorAttestationResponseJSON {
  clientDataJSON: string;
  attestationObject: string;
  transports?: AuthenticatorTransport[];
  publicKeyAlgorithm?: number;
  publicKey?: string;
  authenticatorData?: string;
}

export interface AuthenticatorAssertionResponseJSON {
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string | null;
}

export interface RegistrationResponseJSON {
  id: string;
  rawId: string;
  type: PublicKeyCredentialType;
  response: AuthenticatorAttestationResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults?: AuthenticationExtensionsClientOutputs;
}

export interface AuthenticationResponseJSON {
  id: string;
  rawId: string;
  type: PublicKeyCredentialType;
  response: AuthenticatorAssertionResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults?: AuthenticationExtensionsClientOutputs;
}

// Browser extension bags (opaque for our purposes)
export type AuthenticationExtensionsClientInputs = Record<string, unknown>;
export type AuthenticationExtensionsClientOutputs = Record<string, unknown>;

// ── Results ─────────────────────────────────────────────────

export interface RegistrationVerified {
  credential: PasskeyCredential;
}

export interface AuthenticationVerified {
  credential: PasskeyCredential;
  userId: string | number;
  newCounter: number;
}
