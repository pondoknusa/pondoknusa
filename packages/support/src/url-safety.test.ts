import { describe, expect, it } from 'vitest';
import { assertPublicHttpUrl, isDisallowedIp } from './url-safety.js';

describe('url-safety', () => {
  it('allows public https URLs', async () => {
    const url = await assertPublicHttpUrl('https://example.com/hook');
    expect(url.hostname).toBe('example.com');
  });

  it('rejects loopback and private addresses', async () => {
    await expect(assertPublicHttpUrl('http://127.0.0.1/hook')).rejects.toThrow(/disallowed/);
    await expect(assertPublicHttpUrl('http://10.0.0.5/hook')).rejects.toThrow(/disallowed/);
    await expect(assertPublicHttpUrl('http://localhost/hook')).rejects.toThrow(/disallowed/);
  });

  it('classifies disallowed IPv4 ranges', () => {
    expect(isDisallowedIp('192.168.1.1')).toBe(true);
    expect(isDisallowedIp('8.8.8.8')).toBe(false);
    expect(isDisallowedIp('169.254.169.254')).toBe(true);
  });
});
