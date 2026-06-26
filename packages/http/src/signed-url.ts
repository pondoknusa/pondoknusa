import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RouteParams } from './types.js';

export interface SignedUrlOptions {
  secret: string;
  expiresAt?: number;
  query?: Record<string, string>;
}

export function signRouteUrl(
  url: string,
  options: SignedUrlOptions,
): string {
  const parsed = new URL(url, 'http://localhost');
  const expiresAt = options.expiresAt;

  if (expiresAt !== undefined) {
    parsed.searchParams.set('expires', String(expiresAt));
  }

  const payload = `${parsed.pathname}${parsed.search}`;
  const signature = createHmac('sha256', options.secret).update(payload).digest('hex');
  parsed.searchParams.set('signature', signature);

  for (const [key, value] of Object.entries(options.query ?? {})) {
    parsed.searchParams.set(key, value);
  }

  return `${parsed.pathname}${parsed.search}`;
}

export function verifySignedRouteUrl(
  pathname: string,
  searchParams: URLSearchParams,
  secret: string,
): boolean {
  const signature = searchParams.get('signature');
  if (!signature) {
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

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function temporarySignedRouteParams(
  ttlSeconds: number,
): Pick<SignedUrlOptions, 'expiresAt'> {
  return {
    expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
}

export type { RouteParams };