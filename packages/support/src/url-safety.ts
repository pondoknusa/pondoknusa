import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google',
]);

/**
 * Validates that a URL is http(s) and does not resolve to a private,
 * loopback, link-local, or cloud-metadata address. Use before server-side
 * fetches of caller-influenced URLs (webhook notifications, etc.).
 */
export async function assertPublicHttpUrl(urlString: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid webhook URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Webhook URL must use http or https.');
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')) {
    throw new Error('Webhook URL targets a disallowed hostname.');
  }

  const addresses = await resolveAddresses(hostname);
  for (const address of addresses) {
    if (isDisallowedIp(address)) {
      throw new Error('Webhook URL targets a disallowed address.');
    }
  }

  return url;
}

async function resolveAddresses(hostname: string): Promise<string[]> {
  if (isIP(hostname)) {
    return [hostname];
  }

  try {
    const results = await lookup(hostname, { all: true, verbatim: true });
    return results.map((entry) => entry.address);
  } catch {
    throw new Error('Webhook URL hostname could not be resolved.');
  }
}

export function isDisallowedIp(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }

  if (normalized.includes(':')) {
    // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
    if (
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true;
    }
    // IPv4-mapped IPv6
    const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped?.[1]) {
      return isDisallowedIpv4(mapped[1]);
    }
    return false;
  }

  return isDisallowedIpv4(normalized);
}

function isDisallowedIpv4(address: string): boolean {
  const parts = address.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts as [number, number, number, number];

  // Loopback, current network, private, link-local, CGNAT, multicast, reserved, broadcast
  if (a === 0 || a === 10 || a === 127 || a >= 224) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }

  return false;
}
