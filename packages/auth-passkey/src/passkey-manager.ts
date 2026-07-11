/**
 * @pondoknusa/auth-passkey — Passkey / WebAuthn manager.
 *
 * Zero external dependencies. Supports ES256 (P-256) platform and
 * cross-platform authenticators with `none` attestation.
 */

import { createHash, verify as cryptoVerify } from 'node:crypto';
import { fromBase64Url, randomBase64Url, stringToBase64Url, toBase64Url } from './base64url.js';
import { parseAttestationObject, parseAuthenticatorData } from './authenticator-data.js';
import { COSE_ALG_ES256, coseBytesToKeyObject } from './cose.js';
import { PasskeyError } from './exceptions.js';
import type {
  AuthenticationResponseJSON,
  AuthenticationVerified,
  PasskeyChallengeStore,
  PasskeyConfig,
  PasskeyCredential,
  PasskeyCredentialRepository,
  PasskeyUser,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  RegistrationVerified,
} from './types.js';

export class PasskeyManager {
  constructor(
    private readonly config: PasskeyConfig,
    private readonly credentials: PasskeyCredentialRepository,
    private readonly challenges: PasskeyChallengeStore,
  ) {}

  get rpId(): string {
    return this.config.rpId;
  }

  get rpName(): string {
    return this.config.rpName;
  }

  get timeoutMs(): number {
    return this.config.timeoutMs ?? 60_000;
  }

  get challengeTtlSeconds(): number {
    return this.config.challengeTtlSeconds ?? 300;
  }

  get userVerification() {
    return this.config.userVerification ?? 'preferred';
  }

  // ── Registration ──────────────────────────────────────────

  /**
   * Build PublicKeyCredentialCreationOptions for `navigator.credentials.create()`.
   */
  async generateRegistrationOptions(
    user: PasskeyUser,
    options?: {
      excludeCredentials?: boolean;
      label?: string;
    },
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const challenge = randomBase64Url(32);
    await this.challenges.put({
      challenge,
      ceremony: 'registration',
      userId: user.id,
      expiresAt: Date.now() + this.challengeTtlSeconds * 1000,
    });

    let excludeCredentials: PublicKeyCredentialCreationOptionsJSON['excludeCredentials'];
    if (options?.excludeCredentials !== false) {
      const existing = await this.credentials.findByUserId(user.id);
      excludeCredentials = existing.map((cred) => ({
        type: 'public-key' as const,
        id: cred.id,
        transports: cred.transports,
      }));
    }

    const residentKey = this.config.residentKey ?? 'preferred';

    return {
      rp: {
        name: this.config.rpName,
        id: this.config.rpId,
      },
      user: {
        id: stringToBase64Url(String(user.id)),
        name: user.name,
        displayName: user.displayName,
      },
      challenge,
      pubKeyCredParams: [{ type: 'public-key', alg: COSE_ALG_ES256 }],
      timeout: this.timeoutMs,
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: this.config.authenticatorAttachment,
        residentKey,
        requireResidentKey: residentKey === 'required',
        userVerification: this.userVerification,
      },
      attestation: this.config.attestation ?? 'none',
    };
  }

  /**
   * Verify a registration response and persist the new credential.
   */
  async verifyRegistration(
    response: RegistrationResponseJSON,
    options?: { expectedUserId?: string | number; label?: string },
  ): Promise<RegistrationVerified> {
    if (response.type !== 'public-key') {
      throw new PasskeyError('Credential type must be public-key', 'type_mismatch');
    }

    const clientData = parseClientDataJSON(response.response.clientDataJSON);
    this.assertClientData(clientData, 'webauthn.create');

    const challengeRecord = await this.challenges.take(clientData.challenge);
    if (!challengeRecord || challengeRecord.ceremony !== 'registration') {
      throw new PasskeyError('Registration challenge is invalid or expired', 'challenge_invalid');
    }

    const expectedUserId = options?.expectedUserId ?? challengeRecord.userId;
    if (expectedUserId === undefined) {
      throw new PasskeyError('Registration challenge is missing user binding', 'user_mismatch');
    }

    const attestationBytes = fromBase64Url(response.response.attestationObject);
    const { fmt, authData } = parseAttestationObject(attestationBytes);

    if (fmt !== 'none' && fmt !== 'packed') {
      // packed without signature chain still yields usable authData + public key
      // for self-attestation; we only require a parseable public key below.
      if (fmt !== 'packed') {
        throw new PasskeyError(
          `Unsupported attestation format "${fmt}"; only "none" (and basic packed) are supported`,
          'attestation_unsupported',
        );
      }
    }

    const authenticatorData = parseAuthenticatorData(authData);
    this.assertRpIdHash(authenticatorData.rpIdHash);

    if (!authenticatorData.userPresent) {
      throw new PasskeyError('User presence flag not set', 'user_not_present');
    }
    if (this.userVerification === 'required' && !authenticatorData.userVerified) {
      throw new PasskeyError('User verification required but not performed', 'user_not_verified');
    }

    const attested = authenticatorData.attestedCredentialData;
    if (!attested) {
      throw new PasskeyError('Registration response missing attested credential data', 'malformed');
    }

    const credentialId = toBase64Url(attested.credentialId);
    if (credentialId !== response.id && credentialId !== response.rawId) {
      throw new PasskeyError('Credential id does not match attested credential', 'malformed');
    }

    // Validate that the public key is ES256
    try {
      coseBytesToKeyObject(attested.credentialPublicKey);
    } catch (error) {
      throw new PasskeyError(
        error instanceof Error ? error.message : 'Unsupported public key',
        'algorithm_unsupported',
      );
    }

    const existing = await this.credentials.findByCredentialId(credentialId);
    if (existing) {
      throw new PasskeyError('Credential already registered', 'credential_exists');
    }

    const credential: PasskeyCredential = {
      id: credentialId,
      userId: expectedUserId,
      publicKey: new Uint8Array(attested.credentialPublicKey),
      counter: authenticatorData.signCount,
      transports: response.response.transports,
      label: options?.label,
      createdAt: Date.now(),
    };

    await this.credentials.save(credential);
    return { credential };
  }

  // ── Authentication ────────────────────────────────────────

  /**
   * Build PublicKeyCredentialRequestOptions for `navigator.credentials.get()`.
   * Pass `userId` to restrict to that user's credentials (non-discoverable flow).
   * Omit for discoverable / conditional UI (passkeys).
   */
  async generateAuthenticationOptions(options?: {
    userId?: string | number;
    allowCredentials?: Array<{ id: string; transports?: PasskeyCredential['transports'] }>;
  }): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const challenge = randomBase64Url(32);
    await this.challenges.put({
      challenge,
      ceremony: 'authentication',
      userId: options?.userId,
      expiresAt: Date.now() + this.challengeTtlSeconds * 1000,
    });

    let allowCredentials = options?.allowCredentials?.map((c) => ({
      type: 'public-key' as const,
      id: c.id,
      transports: c.transports,
    }));

    if (!allowCredentials && options?.userId !== undefined) {
      const creds = await this.credentials.findByUserId(options.userId);
      allowCredentials = creds.map((c) => ({
        type: 'public-key' as const,
        id: c.id,
        transports: c.transports,
      }));
    }

    return {
      challenge,
      timeout: this.timeoutMs,
      rpId: this.config.rpId,
      allowCredentials,
      userVerification: this.userVerification,
    };
  }

  /**
   * Verify an authentication assertion and update the signature counter.
   */
  async verifyAuthentication(
    response: AuthenticationResponseJSON,
    options?: { expectedUserId?: string | number },
  ): Promise<AuthenticationVerified> {
    if (response.type !== 'public-key') {
      throw new PasskeyError('Credential type must be public-key', 'type_mismatch');
    }

    const clientData = parseClientDataJSON(response.response.clientDataJSON);
    this.assertClientData(clientData, 'webauthn.get');

    const challengeRecord = await this.challenges.take(clientData.challenge);
    if (!challengeRecord || challengeRecord.ceremony !== 'authentication') {
      throw new PasskeyError('Authentication challenge is invalid or expired', 'challenge_invalid');
    }

    const credential = await this.credentials.findByCredentialId(response.id);
    if (!credential) {
      throw new PasskeyError('Unknown passkey credential', 'credential_unknown');
    }

    if (
      options?.expectedUserId !== undefined &&
      String(credential.userId) !== String(options.expectedUserId)
    ) {
      throw new PasskeyError('Credential does not belong to the expected user', 'user_mismatch');
    }

    if (
      challengeRecord.userId !== undefined &&
      String(credential.userId) !== String(challengeRecord.userId)
    ) {
      throw new PasskeyError('Credential does not match challenge user', 'user_mismatch');
    }

    const authDataBytes = fromBase64Url(response.response.authenticatorData);
    const authenticatorData = parseAuthenticatorData(authDataBytes);
    this.assertRpIdHash(authenticatorData.rpIdHash);

    if (!authenticatorData.userPresent) {
      throw new PasskeyError('User presence flag not set', 'user_not_present');
    }
    if (this.userVerification === 'required' && !authenticatorData.userVerified) {
      throw new PasskeyError('User verification required but not performed', 'user_not_verified');
    }

    // Counter must strictly increase when the authenticator reports a non-zero counter
    if (authenticatorData.signCount > 0) {
      if (authenticatorData.signCount <= credential.counter) {
        throw new PasskeyError(
          'Authenticator signature counter did not increase',
          'counter_invalid',
        );
      }
    }

    const clientDataHash = createHash('sha256')
      .update(fromBase64Url(response.response.clientDataJSON))
      .digest();
    const signed = Buffer.concat([Buffer.from(authDataBytes), clientDataHash]);
    const signature = Buffer.from(fromBase64Url(response.response.signature));
    const publicKey = coseBytesToKeyObject(credential.publicKey);

    const valid = cryptoVerify('sha256', signed, publicKey, signature);
    if (!valid) {
      throw new PasskeyError('Passkey signature verification failed', 'signature_invalid');
    }

    const newCounter = authenticatorData.signCount;
    if (newCounter > 0) {
      await this.credentials.updateCounter(credential.id, newCounter);
    }

    return {
      credential: { ...credential, counter: newCounter > 0 ? newCounter : credential.counter },
      userId: credential.userId,
      newCounter: newCounter > 0 ? newCounter : credential.counter,
    };
  }

  // ── Helpers ───────────────────────────────────────────────

  private expectedOrigins(): string[] {
    return Array.isArray(this.config.origin) ? this.config.origin : [this.config.origin];
  }

  private assertClientData(
    clientData: ClientDataJSON,
    expectedType: 'webauthn.create' | 'webauthn.get',
  ): void {
    if (clientData.type !== expectedType) {
      throw new PasskeyError(
        `clientDataJSON.type must be ${expectedType}`,
        'type_mismatch',
      );
    }

    if (!this.expectedOrigins().includes(clientData.origin)) {
      throw new PasskeyError(
        `clientDataJSON.origin "${clientData.origin}" is not allowed`,
        'origin_mismatch',
      );
    }
  }

  private assertRpIdHash(rpIdHash: Uint8Array): void {
    const expected = createHash('sha256').update(this.config.rpId).digest();
    if (!timingSafeEqual(rpIdHash, expected)) {
      throw new PasskeyError('authenticatorData rpIdHash mismatch', 'rp_id_mismatch');
    }
  }
}

// ── ClientDataJSON ──────────────────────────────────────────

interface ClientDataJSON {
  type: string;
  challenge: string;
  origin: string;
  crossOrigin?: boolean;
}

function parseClientDataJSON(base64url: string): ClientDataJSON {
  let json: unknown;
  try {
    const text = new TextDecoder().decode(fromBase64Url(base64url));
    json = JSON.parse(text) as unknown;
  } catch {
    throw new PasskeyError('clientDataJSON is not valid JSON', 'malformed');
  }

  if (!json || typeof json !== 'object') {
    throw new PasskeyError('clientDataJSON must be an object', 'malformed');
  }

  const record = json as Record<string, unknown>;
  if (typeof record.type !== 'string' || typeof record.challenge !== 'string' || typeof record.origin !== 'string') {
    throw new PasskeyError('clientDataJSON missing required fields', 'malformed');
  }

  return {
    type: record.type,
    challenge: record.challenge,
    origin: record.origin,
    crossOrigin: typeof record.crossOrigin === 'boolean' ? record.crossOrigin : undefined,
  };
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array | Buffer): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}
