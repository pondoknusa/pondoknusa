import { webcrypto } from 'node:crypto';
import type { OAuthProviderConfig } from '../../types.js';
import type { OAuthUserProfile } from '../../oauth-types.js';
import type { OAuthAuthorizeContext, OAuthExchangeContext, SocialOAuthDriver } from '../types.js';
import { createAppleClientSecret } from '../apple-secret.js';
import { appendPkceParams } from '../http.js';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

interface AppleJwk {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  crv?: string;
  n?: string;
  e?: string;
  x?: string;
  y?: string;
}

let jwksCache: { keys: AppleJwk[]; expiresAt: number } | null = null;

async function fetchAppleJwks(forceRefresh = false): Promise<AppleJwk[]> {
  const now = Date.now();
  if (!forceRefresh && jwksCache && jwksCache.expiresAt > now) {
    return jwksCache.keys;
  }
  const response = await fetch(APPLE_JWKS_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch Apple signing keys.');
  }
  const json = (await response.json()) as { keys?: AppleJwk[] };
  const keys = Array.isArray(json.keys) ? json.keys : [];
  jwksCache = { keys, expiresAt: now + 60 * 60 * 1000 };
  return keys;
}

function findAppleJwk(keys: AppleJwk[], kid?: string): AppleJwk | undefined {
  return keys.find((key) => key.kid === kid && key.kty === 'EC');
}

async function resolveAppleJwk(kid?: string): Promise<AppleJwk> {
  let jwk = findAppleJwk(await fetchAppleJwks(), kid);
  if (!jwk) {
    jwk = findAppleJwk(await fetchAppleJwks(true), kid);
  }
  if (!jwk) {
    throw new Error('No matching Apple signing key.');
  }
  return jwk;
}

async function verifyAppleIdToken(idToken: string, clientId: string): Promise<OAuthUserProfile> {
  const segments = idToken.split('.');
  if (segments.length !== 3) {
    throw new Error('Malformed Apple id_token.');
  }
  const [headerB64, payloadB64, signatureB64] = segments;
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Malformed Apple id_token.');
  }

  let header: { kid?: string; alg?: string };
  let claims: {
    sub: string;
    email?: string;
    email_verified?: string | boolean;
    iss?: string;
    aud?: string;
    exp?: number;
    nbf?: number;
  };
  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as typeof header;
    claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as typeof claims;
  } catch {
    throw new Error('Malformed Apple id_token.');
  }

  if (typeof claims.sub !== 'string' || claims.sub.length === 0) {
    throw new Error('Apple id_token is missing sub.');
  }
  if (header.alg !== 'ES256') {
    throw new Error('Unsupported Apple id_token algorithm.');
  }
  if (claims.iss !== APPLE_ISSUER) {
    throw new Error('Apple id_token issuer mismatch.');
  }
  if (claims.aud !== clientId) {
    throw new Error('Apple id_token audience mismatch.');
  }
  if (typeof claims.nbf === 'number' && claims.nbf * 1000 > Date.now()) {
    throw new Error('Apple id_token is not yet valid.');
  }
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) {
    throw new Error('Apple id_token has expired.');
  }

  const jwk = await resolveAppleJwk(header.kid);

  const cryptoKey = await webcrypto.subtle.importKey(
    'jwk',
    jwk as never,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );

  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = new Uint8Array(Buffer.from(signatureB64, 'base64url'));
  const valid = await webcrypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    signature,
    signedData,
  );
  if (!valid) {
    throw new Error('Apple id_token signature verification failed.');
  }

  return {
    id: claims.sub,
    email: claims.email ?? null,
    name: null,
    avatar: null,
    emailVerified: claims.email_verified === true || claims.email_verified === 'true',
  };
}

export class AppleOAuthDriver implements SocialOAuthDriver {
  readonly name = 'apple';
  readonly usesPkce = true;

  constructor(private readonly config: OAuthProviderConfig) {}

  authorizationUrl(state: string, context?: OAuthAuthorizeContext): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      response_mode: 'query',
      scope: (this.config.scopes ?? ['name', 'email']).join(' '),
      state,
    });
    appendPkceParams(params, context);
    return `https://appleid.apple.com/auth/authorize?${params}`;
  }

  async exchangeCode(code: string, context?: OAuthExchangeContext): Promise<OAuthUserProfile> {
    const clientSecret = this.resolveClientSecret();
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
    });

    if (context?.codeVerifier) {
      body.set('code_verifier', context.codeVerifier);
    }

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    const json = (await response.json()) as { id_token?: string; error?: string };
    if (!json.id_token) {
      throw new Error(json.error ?? 'Apple OAuth token exchange failed');
    }

    return verifyAppleIdToken(json.id_token, this.config.clientId);
  }

  private resolveClientSecret(): string {
    if (this.config.teamId && this.config.keyId && this.config.privateKey) {
      return createAppleClientSecret({
        teamId: this.config.teamId,
        keyId: this.config.keyId,
        clientId: this.config.clientId,
        privateKey: this.config.privateKey,
      });
    }

    return this.config.clientSecret;
  }
}