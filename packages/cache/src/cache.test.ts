import { describe, expect, it } from 'vitest';
import { CacheManager, CacheRepository } from './index.js';

describe('CacheRepository', () => {
  it('remembers values with ttl', async () => {
    const manager = new CacheManager({
      default: 'array',
      connections: { array: { driver: 'array' } },
    });
    const cache = new CacheRepository(manager);
    let calls = 0;
    const value = await cache.remember('key', 60, () => {
      calls += 1;
      return 'cached';
    });
    expect(value).toBe('cached');
    expect(calls).toBe(1);
    expect(await cache.get('key')).toBe('cached');
    expect(
      await cache.remember('key', 60, () => {
        calls += 1;
        return 'other';
      }),
    ).toBe('cached');
    expect(calls).toBe(1);
  });
});