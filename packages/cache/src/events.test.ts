import { describe, expect, it } from 'vitest';
import { CacheManager, CacheRepository, clearCacheEventListeners, onCacheEvent } from './index.js';

describe('cache events', () => {
  it('emits hit, miss, and write events', async () => {
    clearCacheEventListeners();
    const events: string[] = [];
    onCacheEvent('cache:hit', () => events.push('hit'));
    onCacheEvent('cache:miss', () => events.push('miss'));
    onCacheEvent('cache:write', () => events.push('write'));

    const cache = new CacheRepository(new CacheManager({
      default: 'array',
      connections: { array: { driver: 'array' } },
    }));

    await cache.get('missing');
    await cache.put('key', 'value');
    await cache.get('key');

    expect(events).toEqual(['miss', 'write', 'hit']);
  });
});