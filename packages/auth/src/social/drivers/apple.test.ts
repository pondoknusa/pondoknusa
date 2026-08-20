import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

type EcKeyPair = { publicKey: CryptoKey; privateKey: CryptoKey };

function base64url(input: Uint8Array | string): string {
  return Buffer.from(input).toString('base64url');
}

function makeFetchStub(jwks: unknown, tokenBody: unknown) {
  return vi.fn(async (url: string | URL) => {
    const target = String(url);
    if (target.includes('/auth/keys')) {
      return new Response(JSON.stringify(jwks), { status: 200 });
    }
    if (target.includes('/auth/token')) {
      return new Response(JSON.stringify(tokenBody), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  });
}

async function buildSignedAppleToken(
  privateKey: CryptoKey,
  kid: string,
  claims: Record<string, unknown>,
): Promise<string> {
  const header = { kid, alg: 'ES256' };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(claims));
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = new Uint8Array(
    await webcrypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      new TextEncoder().encode(signingInput),
    ),
  );
  return `${headerB64}.${payloadB64}.${base64url(signature)}`;
}

describe('AppleOAuthDriver id_token verification', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', makeFetchStub({}, {}));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('verifies a valid ES256 id_token against the published JWKS', async () => {
    const { AppleOAuthDriver } = await import('./apple.js');
    const pair = (await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )) as EcKeyPair;
    const publicJwk = (await webcrypto.subtle.exportKey('jwk', pair.publicKey)) as Record<string, unknown>;
    const kid = 'test-kid';
    const jwks = { keys: [{ ...publicJwk, kid, alg: 'ES256', use: 'sig' }] };

    const now = Math.floor(Date.now() / 1000);
    const token = await buildSignedAppleToken(pair.privateKey, kid, {
      sub: 'apple-sub-123',
      email: 'user@example.com',
      email_verified: 'true',
      iss: 'https://appleid.apple.com',
      aud: 'com.example.app',
      exp: now + 3600,
    });

    vi.stubGlobal('fetch', makeFetchStub(jwks, { id_token: token }));

    const driver = new AppleOAuthDriver({ clientId: 'com.example.app' } as never);
    const profile = await driver.exchangeCode('code');

    expect(profile.id).toBe('apple-sub-123');
    expect(profile.email).toBe('user@example.com');
    expect(profile.emailVerified).toBe(true);
  });

  it('rejects a token with a mismatched audience', async () => {
    const { AppleOAuthDriver } = await import('./apple.js');
    const pair = (await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )) as EcKeyPair;
    const publicJwk = (await webcrypto.subtle.exportKey('jwk', pair.publicKey)) as Record<string, unknown>;
    const kid = 'test-kid-2';
    const jwks = { keys: [{ ...publicJwk, kid, alg: 'ES256', use: 'sig' }] };

    const now = Math.floor(Date.now() / 1000);
    const token = await buildSignedAppleToken(pair.privateKey, kid, {
      sub: 'x',
      iss: 'https://appleid.apple.com',
      aud: 'some-other-audience',
      exp: now + 3600,
    });

    vi.stubGlobal('fetch', makeFetchStub(jwks, { id_token: token }));

    const driver = new AppleOAuthDriver({ clientId: 'com.example.app' } as never);
    await expect(driver.exchangeCode('code')).rejects.toThrow(/audience/i);
  });

  it('rejects a token whose signature does not verify', async () => {
    const { AppleOAuthDriver } = await import('./apple.js');
    const pair = (await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )) as EcKeyPair;
    const publicJwk = (await webcrypto.subtle.exportKey('jwk', pair.publicKey)) as Record<string, unknown>;
    const kid = 'test-kid-3';
    const jwks = { keys: [{ ...publicJwk, kid, alg: 'ES256', use: 'sig' }] };

    const now = Math.floor(Date.now() / 1000);
    const token = await buildSignedAppleToken(pair.privateKey, kid, {
      sub: 'x',
      iss: 'https://appleid.apple.com',
      aud: 'com.example.app',
      exp: now + 3600,
    });
    const tampered = `${token.split('.').slice(0, 2).join('.')}.${base64url('forged-signature')}`;

    vi.stubGlobal('fetch', makeFetchStub(jwks, { id_token: tampered }));

    const driver = new AppleOAuthDriver({ clientId: 'com.example.app' } as never);
    await expect(driver.exchangeCode('code')).rejects.toThrow(/signature/i);
  });

  it('refetches JWKS when the cached key set does not contain the token kid', async () => {
    const { AppleOAuthDriver } = await import('./apple.js');
    const pair = (await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )) as EcKeyPair;
    const publicJwk = (await webcrypto.subtle.exportKey('jwk', pair.publicKey)) as Record<string, unknown>;
    const kid = 'rotated-kid';
    const jwks = { keys: [{ ...publicJwk, kid, alg: 'ES256', use: 'sig' }] };

    const now = Math.floor(Date.now() / 1000);
    const token = await buildSignedAppleToken(pair.privateKey, kid, {
      sub: 'apple-sub-rotated',
      iss: 'https://appleid.apple.com',
      aud: 'com.example.app',
      exp: now + 3600,
    });

    let jwksCalls = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string | URL) => {
      const target = String(url);
      if (target.includes('/auth/keys')) {
        jwksCalls += 1;
        if (jwksCalls === 1) {
          return new Response(JSON.stringify({ keys: [] }), { status: 200 });
        }
        return new Response(JSON.stringify(jwks), { status: 200 });
      }
      if (target.includes('/auth/token')) {
        return new Response(JSON.stringify({ id_token: token }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }));

    const driver = new AppleOAuthDriver({ clientId: 'com.example.app' } as never);
    const profile = await driver.exchangeCode('code');
    expect(profile.id).toBe('apple-sub-rotated');
    expect(jwksCalls).toBe(2);
  });

  it('rejects a token without exp', async () => {
    const { AppleOAuthDriver } = await import('./apple.js');
    const pair = (await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )) as EcKeyPair;
    const publicJwk = (await webcrypto.subtle.exportKey('jwk', pair.publicKey)) as Record<string, unknown>;
    const kid = 'test-kid-exp';
    const jwks = { keys: [{ ...publicJwk, kid, alg: 'ES256', use: 'sig' }] };

    const token = await buildSignedAppleToken(pair.privateKey, kid, {
      sub: 'x',
      iss: 'https://appleid.apple.com',
      aud: 'com.example.app',
    });

    vi.stubGlobal('fetch', makeFetchStub(jwks, { id_token: token }));

    const driver = new AppleOAuthDriver({ clientId: 'com.example.app' } as never);
    await expect(driver.exchangeCode('code')).rejects.toThrow(/expired/i);
  });

  it('rejects a token that is not yet valid', async () => {
    const { AppleOAuthDriver } = await import('./apple.js');
    const pair = (await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )) as EcKeyPair;
    const publicJwk = (await webcrypto.subtle.exportKey('jwk', pair.publicKey)) as Record<string, unknown>;
    const kid = 'test-kid-nbf';
    const jwks = { keys: [{ ...publicJwk, kid, alg: 'ES256', use: 'sig' }] };

    const now = Math.floor(Date.now() / 1000);
    const token = await buildSignedAppleToken(pair.privateKey, kid, {
      sub: 'x',
      iss: 'https://appleid.apple.com',
      aud: 'com.example.app',
      nbf: now + 3600,
      exp: now + 7200,
    });

    vi.stubGlobal('fetch', makeFetchStub(jwks, { id_token: token }));

    const driver = new AppleOAuthDriver({ clientId: 'com.example.app' } as never);
    await expect(driver.exchangeCode('code')).rejects.toThrow(/not yet valid/i);
  });
});
