/**
 * @pondoknusa/auth-passkey/browser — Browser-side WebAuthn helpers.
 *
 * Zero dependencies. Import from `@pondoknusa/auth-passkey/browser` in client code.
 */

import { fromBase64Url, toBase64Url } from './base64url.js';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from './types.js';

export { toBase64Url, fromBase64Url, stringToBase64Url, base64UrlToString } from './base64url.js';
export type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from './types.js';

/** True when the browser supports public-key credentials (WebAuthn). */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  );
}

/**
 * True when conditional mediation (passkey autofill) is available.
 */
export async function isConditionalMediationAvailable(): Promise<boolean> {
  if (!isPasskeySupported()) return false;
  const ctor = window.PublicKeyCredential as typeof PublicKeyCredential & {
    isConditionalMediationAvailable?: () => Promise<boolean>;
  };
  if (typeof ctor.isConditionalMediationAvailable !== 'function') {
    return false;
  }
  try {
    return await ctor.isConditionalMediationAvailable();
  } catch {
    return false;
  }
}

/**
 * Register a new passkey. Pass options from `PasskeyManager.generateRegistrationOptions()`.
 */
export async function createPasskey(
  options: PublicKeyCredentialCreationOptionsJSON,
): Promise<RegistrationResponseJSON> {
  if (!isPasskeySupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  const credential = (await navigator.credentials.create({
    publicKey: creationOptionsFromJSON(options),
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Passkey registration was cancelled or failed');
  }

  return registrationResponseToJSON(credential);
}

/**
 * Authenticate with an existing passkey. Pass options from
 * `PasskeyManager.generateAuthenticationOptions()`.
 */
export async function getPasskey(
  options: PublicKeyCredentialRequestOptionsJSON,
  mediation?: CredentialMediationRequirement,
): Promise<AuthenticationResponseJSON> {
  if (!isPasskeySupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  const credential = (await navigator.credentials.get({
    publicKey: requestOptionsFromJSON(options),
    mediation,
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Passkey authentication was cancelled or failed');
  }

  return authenticationResponseToJSON(credential);
}

// ── Option converters (JSON ↔ ArrayBuffer) ──────────────────

export function creationOptionsFromJSON(
  options: PublicKeyCredentialCreationOptionsJSON,
): PublicKeyCredentialCreationOptions {
  return {
    rp: options.rp,
    user: {
      id: bufferSourceFromBase64Url(options.user.id),
      name: options.user.name,
      displayName: options.user.displayName,
    },
    challenge: bufferSourceFromBase64Url(options.challenge),
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    excludeCredentials: options.excludeCredentials?.map((c) => ({
      type: c.type,
      id: bufferSourceFromBase64Url(c.id),
      transports: c.transports as globalThis.AuthenticatorTransport[] | undefined,
    })),
    authenticatorSelection: options.authenticatorSelection,
    attestation: options.attestation,
    extensions: options.extensions as AuthenticationExtensionsClientInputs | undefined,
  };
}

export function requestOptionsFromJSON(
  options: PublicKeyCredentialRequestOptionsJSON,
): PublicKeyCredentialRequestOptions {
  return {
    challenge: bufferSourceFromBase64Url(options.challenge),
    timeout: options.timeout,
    rpId: options.rpId,
    allowCredentials: options.allowCredentials?.map((c) => ({
      type: c.type,
      id: bufferSourceFromBase64Url(c.id),
      transports: c.transports as globalThis.AuthenticatorTransport[] | undefined,
    })),
    userVerification: options.userVerification,
    extensions: options.extensions as AuthenticationExtensionsClientInputs | undefined,
  };
}

export function registrationResponseToJSON(
  credential: PublicKeyCredential,
): RegistrationResponseJSON {
  const response = credential.response as AuthenticatorAttestationResponse;
  const transports =
    typeof response.getTransports === 'function'
      ? (response.getTransports() as RegistrationResponseJSON['response']['transports'])
      : undefined;

  return {
    id: credential.id,
    rawId: toBase64Url(new Uint8Array(credential.rawId)),
    type: 'public-key',
    authenticatorAttachment: (credential as PublicKeyCredential & {
      authenticatorAttachment?: RegistrationResponseJSON['authenticatorAttachment'];
    }).authenticatorAttachment,
    response: {
      clientDataJSON: toBase64Url(new Uint8Array(response.clientDataJSON)),
      attestationObject: toBase64Url(new Uint8Array(response.attestationObject)),
      transports,
    },
    clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
  };
}

export function authenticationResponseToJSON(
  credential: PublicKeyCredential,
): AuthenticationResponseJSON {
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: toBase64Url(new Uint8Array(credential.rawId)),
    type: 'public-key',
    authenticatorAttachment: (credential as PublicKeyCredential & {
      authenticatorAttachment?: AuthenticationResponseJSON['authenticatorAttachment'];
    }).authenticatorAttachment,
    response: {
      clientDataJSON: toBase64Url(new Uint8Array(response.clientDataJSON)),
      authenticatorData: toBase64Url(new Uint8Array(response.authenticatorData)),
      signature: toBase64Url(new Uint8Array(response.signature)),
      userHandle: response.userHandle
        ? toBase64Url(new Uint8Array(response.userHandle))
        : null,
    },
    clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
  };
}

function bufferSourceFromBase64Url(value: string): ArrayBuffer {
  const bytes = fromBase64Url(value);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
