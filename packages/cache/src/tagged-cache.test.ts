import { describe, expect, it } from 'vitest';
import { CacheManager, CacheRepository } from './index.js';

describe('TaggedCache', () => {
  it('flushes only tagged keys', async () => {
    const cache = new CacheRepository(new CacheManager({
      default: 'array',
      connections: { array: { driver: 'array' } },
    }));

    await cache.put('untagged', 'keep');
    await cache.tags(['posts']).put('post:1', 'one');
    await cache.tags(['posts', 'user:1']).put('post:2', 'two');

    await cache.tags(['posts']).flush();

    expect(await cache.get('untagged')).toBe('keep');
    expect(await cache.get('post:1')).toBeNull();
    expect(await cache.get('post:2')).toBeNull();
  });
});