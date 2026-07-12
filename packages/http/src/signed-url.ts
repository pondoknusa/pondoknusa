import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RouteParams } from './types.js';

export interface SignedUrlOptions {
  secret: string;
  expiresAt?: number;
  query?: Record<string, string>;
}

const SIGNATURE_HEX_LENGTH = 64;

export function signRouteUrl(
  url: string,
  options: SignedUrlOptions,
): string {
  assertSigningSecret(options.secret);
  const parsed = new URL(url, 'http://localhost');
  const expiresAt = options.expiresAt;

  if (expiresAt !== undefined) {
    parsed.searchParams.set('expires', String(expiresAt));
  }

  for (const [key, value] of Object.entries(options.query ?? {})) {
    parsed.searchParams.set(key, value);
  }

  const payload = `${parsed.pathname}${parsed.search}`;
  const signature = createHmac('sha256', options.secret).update(payload).digest('hex');
  parsed.searchParams.set('signature', signature);

  return `${parsed.pathname}${parsed.search}`;
}

export function verifySignedRouteUrl(
  pathname: string,
  searchParams: URLSearchParams,
  secret: string,
): boolean {
  assertSigningSecret(secret);
  const signature = searchParams.get('signature');
  if (!signature || !isValidSignatureHex(signature)) {
    return false;
  }

  const expires = searchParams.get('expires');
  if (expires) {
    const expiresAt = Number(expires);
    if (!Number.isFinite(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
      return false;
    }
  }

  const params = new URLSearchParams(searchParams);
  params.delete('signature');

  const payload = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');

  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

export function temporarySignedRouteParams(
  ttlSeconds: number,
): Pick<SignedUrlOptions, 'expiresAt'> {
  return {
    expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
}

function assertSigningSecret(secret: string): void {
  if (!secret || secret.length < 16) {
    throw new Error('Signed URL secret must be at least 16 characters.');
  }
}

function isValidSignatureHex(signature: string): boolean {
  return signature.length === SIGNATURE_HEX_LENGTH && /^[0-9a-f]+$/i.test(signature);
}

export type { RouteParams };
