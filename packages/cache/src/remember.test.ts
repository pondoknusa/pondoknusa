import { describe, expect, it } from 'vitest';
import { CacheManager, CacheRepository } from './index.js';

describe('CacheRepository.remember stampede protection', () => {
  it('computes the value once under concurrent remember calls', async () => {
    const cache = new CacheRepository(new CacheManager({
      default: 'array',
      connections: { array: { driver: 'array' } },
    }));

    let calls = 0;
    const callback = async () => {
      calls += 1;
      return `value-${calls}`;
    };

    const [first, second, third] = await Promise.all([
      cache.remember('hot-key', 60, callback, 5),
      cache.remember('hot-key', 60, callback, 5),
      cache.remember('hot-key', 60, callback, 5),
    ]);

    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(calls).toBe(1);
  });
});