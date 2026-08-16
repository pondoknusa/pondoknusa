import { describe, expect, it } from 'vitest';
import { PondoknusaRequest } from './request.js';
import {
  ipMatchesCidr,
  isTrustedProxyPeer,
  normalizeIp,
  resolveClientIp,
  resolveSecure,
} from './trusted-proxies.js';

describe('PondoknusaRequest', () => {
  it('reads page and per_page query parameters', () => {
    const request = new PondoknusaRequest(
      new Request('http://localhost/users?page=3&per_page=25'),
    );

    expect(request.page()).toBe(3);
    expect(request.perPage()).toBe(25);
    expect(request.page('page', 1)).toBe(3);
    expect(request.perPage('per_page', 15, 20)).toBe(20);
  });

  it('falls back when query values are invalid', () => {
    const request = new PondoknusaRequest(
      new Request('http://localhost/users?page=0&per_page=-5'),
    );

    expect(request.page()).toBe(1);
    expect(request.perPage()).toBe(15);
  });

  it('reinitializes and clears mutable request state', () => {
    const request = new PondoknusaRequest(new Request('http://localhost/a'), { id: '1' }, 'a.show');
    request.user = { id: 42 };
    request.locale = 'en';

    request.reinitialize(new Request('http://localhost/b'), { id: '2' }, 'b.show');

    expect(request.path).toBe('/b');
    expect(request.param('id')).toBe('2');
    expect(request.routeName).toBe('b.show');
    expect(request.user).toBeNull();
    expect(request.locale).toBeUndefined();
  });

  it('resolves ip and secure state from trusted proxy headers when peer matches', () => {
    const request = new PondoknusaRequest(
      new Request('http://localhost/users', {
        headers: {
          'x-forwarded-for': '203.0.113.10, 10.0.0.1',
          'x-forwarded-proto': 'https',
        },
      }),
    );

    request.setTrustedProxies(['10.0.0.1']);
    request.remoteAddress = '10.0.0.1';
    expect(request.ip()).toBe('203.0.113.10');
    expect(request.secure()).toBe(true);
  });

  it('ignores forwarded headers when the peer is not a trusted proxy', () => {
    const request = new PondoknusaRequest(
      new Request('http://localhost/users', {
        headers: {
          'x-forwarded-for': '203.0.113.10',
          'x-forwarded-proto': 'https',
        },
      }),
    );

    request.setTrustedProxies(['127.0.0.1', '::1']);
    request.remoteAddress = '198.51.100.20';
    expect(request.ip()).toBe('198.51.100.20');
    expect(request.secure()).toBe(false);
  });
});

describe('trusted proxy peer matching', () => {
  it('normalizes IPv4-mapped IPv6 loopback', () => {
    expect(normalizeIp('::ffff:127.0.0.1')).toBe('127.0.0.1');
    expect(isTrustedProxyPeer('::ffff:127.0.0.1', ['127.0.0.1'])).toBe(true);
  });

  it('matches CIDR ranges used by docker networks', () => {
    expect(ipMatchesCidr('172.18.0.5', '172.16.0.0/12')).toBe(true);
    expect(ipMatchesCidr('10.1.2.3', '10.0.0.0/8')).toBe(true);
    expect(ipMatchesCidr('203.0.113.1', '10.0.0.0/8')).toBe(false);
  });

  it('trusts Cloudflare Tunnel local peers and CF-Connecting-IP', () => {
    const request = new PondoknusaRequest(
      new Request('http://127.0.0.1:3000/', {
        headers: {
          'cf-connecting-ip': '203.0.113.50',
          'x-forwarded-for': '198.51.100.1',
          'x-forwarded-proto': 'https',
        },
      }),
    );
    request.setTrustedProxies(['127.0.0.1', '::1']);
    request.remoteAddress = '127.0.0.1';

    expect(resolveClientIp(request, request.remoteAddress)).toBe('203.0.113.50');
    expect(resolveSecure(request)).toBe(true);
  });
});
