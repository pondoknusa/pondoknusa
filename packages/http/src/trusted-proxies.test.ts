import { describe, expect, it } from 'vitest';
import {
  ipMatchesCidr,
  isTrustedProxyPeer,
  normalizeIp,
} from './trusted-proxies.js';

describe('trusted-proxies helpers', () => {
  it('treats missing remote address as untrusted', () => {
    expect(isTrustedProxyPeer(undefined, ['127.0.0.1'])).toBe(false);
    expect(isTrustedProxyPeer('unknown', ['127.0.0.1'])).toBe(false);
  });

  it('supports wildcard trust escape hatch', () => {
    expect(isTrustedProxyPeer('198.51.100.1', ['*'])).toBe(true);
  });

  it('matches IPv6 loopback forms', () => {
    expect(normalizeIp('0:0:0:0:0:0:0:1')).toBe('::1');
    expect(isTrustedProxyPeer('::1', ['::1'])).toBe(true);
  });

  it('matches IPv6 CIDR prefixes', () => {
    expect(ipMatchesCidr('2001:db8::1', '2001:db8::/32')).toBe(true);
    expect(ipMatchesCidr('2001:db9::1', '2001:db8::/32')).toBe(false);
  });
});
