import type { PondoknusaRequest } from './request.js';
import type { Middleware } from './types.js';

export interface TrustedProxiesOptions {
  /**
   * Peer addresses allowed to supply `X-Forwarded-*` / `X-Real-IP` /
   * `CF-Connecting-IP`. Supports exact IPs, CIDR ranges (e.g. `10.0.0.0/8`),
   * and `*` (trust every peer — insecure; avoid in production).
   *
   * Cloudflare Tunnel and local reverse proxies typically connect as
   * `127.0.0.1` / `::1`. Docker/private networks should list the proxy CIDR.
   */
  proxies: string[];
}

export function createTrustedProxiesMiddleware(
  options: TrustedProxiesOptions,
): Middleware {
  return async (request, next) => {
    request.setTrustedProxies(options.proxies);
    return next();
  };
}

export function resolveClientIp(
  request: PondoknusaRequest,
  remoteAddress?: string,
): string {
  if (shouldTrustForwardedHeaders(request, remoteAddress)) {
    const cfConnectingIp = request.header('cf-connecting-ip')?.trim();
    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    const forwardedFor = request.header('x-forwarded-for');
    if (forwardedFor) {
      const clientIp = forwardedFor.split(',')[0]?.trim();
      if (clientIp) {
        return clientIp;
      }
    }

    const realIp = request.header('x-real-ip')?.trim();
    if (realIp) {
      return realIp;
    }
  }

  return remoteAddress ?? 'unknown';
}

export function resolveSecure(request: PondoknusaRequest): boolean {
  const remoteAddress = request.remoteAddress;
  if (shouldTrustForwardedHeaders(request, remoteAddress)) {
    const forwardedProto = request.header('x-forwarded-proto');
    if (forwardedProto) {
      return forwardedProto.toLowerCase() === 'https';
    }
  }

  return request.url.protocol === 'https:';
}

export function shouldTrustForwardedHeaders(
  request: PondoknusaRequest,
  remoteAddress?: string,
): boolean {
  if (!request.hasTrustedProxies()) {
    return false;
  }

  return isTrustedProxyPeer(remoteAddress, request.getTrustedProxies());
}

/**
 * Returns true when `remoteAddress` matches an entry in `proxies`
 * (exact IP, CIDR, or `*`).
 */
export function isTrustedProxyPeer(
  remoteAddress: string | undefined,
  proxies: string[],
): boolean {
  if (!remoteAddress || remoteAddress === 'unknown' || proxies.length === 0) {
    return false;
  }

  const peer = normalizeIp(remoteAddress);
  if (!peer) {
    return false;
  }

  for (const entry of proxies) {
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed === '*') {
      return true;
    }

    if (trimmed.includes('/')) {
      if (ipMatchesCidr(peer, trimmed)) {
        return true;
      }
      continue;
    }

    const trusted = normalizeIp(trimmed);
    if (trusted && trusted === peer) {
      return true;
    }
  }

  return false;
}

export function normalizeIp(address: string): string | null {
  let value = address.trim().toLowerCase();
  if (!value) {
    return null;
  }

  // Strip IPv6 brackets from Host-style values.
  if (value.startsWith('[') && value.endsWith(']')) {
    value = value.slice(1, -1);
  }

  // Zone id (fe80::1%eth0) — compare without zone.
  const zoneIndex = value.indexOf('%');
  if (zoneIndex !== -1) {
    value = value.slice(0, zoneIndex);
  }

  // IPv4-mapped IPv6 → IPv4
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped?.[1]) {
    return mapped[1];
  }

  if (value === '::1' || value === '0:0:0:0:0:0:0:1') {
    return '::1';
  }

  return value;
}

export function ipMatchesCidr(address: string, cidr: string): boolean {
  const [networkRaw, prefixRaw] = cidr.split('/');
  if (!networkRaw || prefixRaw === undefined) {
    return false;
  }

  const prefix = Number(prefixRaw);
  if (!Number.isInteger(prefix) || prefix < 0) {
    return false;
  }

  const network = normalizeIp(networkRaw);
  const peer = normalizeIp(address);
  if (!network || !peer) {
    return false;
  }

  const peerV4 = parseIpv4(peer);
  const networkV4 = parseIpv4(network);
  if (peerV4 !== null && networkV4 !== null) {
    if (prefix > 32) {
      return false;
    }
    if (prefix === 0) {
      return true;
    }
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return (peerV4 & mask) === (networkV4 & mask);
  }

  const peerV6 = parseIpv6(peer);
  const networkV6 = parseIpv6(network);
  if (peerV6 && networkV6) {
    if (prefix > 128) {
      return false;
    }
    return ipv6PrefixEqual(peerV6, networkV6, prefix);
  }

  return false;
}

function parseIpv4(address: string): number | null {
  const parts = address.split('.');
  if (parts.length !== 4) {
    return null;
  }

  let value = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null;
    }
    value = ((value << 8) + octet) >>> 0;
  }
  return value;
}

function parseIpv6(address: string): number[] | null {
  if (address.includes('.')) {
    return null;
  }

  const [head, tail] = address.split('::');
  const headParts = head ? head.split(':').filter(Boolean) : [];
  const tailParts = tail !== undefined ? (tail ? tail.split(':').filter(Boolean) : []) : [];

  if (tail === undefined && address.includes('::')) {
    return null;
  }

  const total = headParts.length + tailParts.length;
  if (total > 8) {
    return null;
  }

  const missing = tail !== undefined ? 8 - total : 0;
  if (tail === undefined && headParts.length !== 8) {
    return null;
  }

  const parts = [
    ...headParts,
    ...Array.from({ length: missing }, () => '0'),
    ...tailParts,
  ];

  if (parts.length !== 8) {
    return null;
  }

  const words: number[] = [];
  for (const part of parts) {
    if (!/^[0-9a-f]{1,4}$/i.test(part)) {
      return null;
    }
    words.push(Number.parseInt(part, 16));
  }
  return words;
}

function ipv6PrefixEqual(left: number[], right: number[], prefix: number): boolean {
  let bitsLeft = prefix;
  for (let i = 0; i < 8; i += 1) {
    if (bitsLeft <= 0) {
      return true;
    }
    const take = Math.min(16, bitsLeft);
    const shift = 16 - take;
    const mask = take === 16 ? 0xffff : (0xffff << shift) & 0xffff;
    if ((left[i]! & mask) !== (right[i]! & mask)) {
      return false;
    }
    bitsLeft -= take;
  }
  return true;
}
