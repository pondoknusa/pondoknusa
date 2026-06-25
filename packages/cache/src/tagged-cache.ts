import type { CacheRepository } from './cache-repository.js';

export class TaggedCache {
  constructor(
    private readonly repository: CacheRepository,
    private readonly tags: string[],
  ) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    return this.repository.get<T>(key);
  }

  async put(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.repository.put(key, value, ttlSeconds);
    await this.repository.trackTaggedKey(this.tags, key);
  }

  async forget(key: string): Promise<boolean> {
    const removed = await this.repository.forget(key);
    await this.repository.untrackTaggedKey(this.tags, key);
    return removed;
  }

  async flush(): Promise<void> {
    const keys = await this.repository.keysForTags(this.tags);
    for (const key of keys) {
      await this.repository.forget(key);
    }
    await this.repository.clearTags(this.tags);
  }
}