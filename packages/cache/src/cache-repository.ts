import { CacheLock } from './cache-lock.js';
import { CacheManager } from './cache-manager.js';
import { emitCacheEvent } from './events.js';
import { TaggedCache } from './tagged-cache.js';
import type { CacheStore } from './types.js';

export class CacheRepository implements CacheStore {
  private readonly pendingRemember = new Map<string, Promise<unknown>>();

  constructor(
    private readonly manager: CacheManager,
    private readonly connection?: string,
  ) {}

  private store(): CacheStore {
    return this.manager.store(this.connection);
  }

  private key(key: string): string {
    return this.manager.prefixKey(key);
  }

  private eventPayload(key: string) {
    return { key, connection: this.connection };
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.store().get<T>(this.key(key));
    emitCacheEvent(value === null ? 'cache:miss' : 'cache:hit', this.eventPayload(key));
    return value;
  }

  async put(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.store().put(this.key(key), value, ttlSeconds);
    emitCacheEvent('cache:write', this.eventPayload(key));
  }

  async add(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    const added = await this.store().add(this.key(key), value, ttlSeconds);
    if (added) {
      emitCacheEvent('cache:write', this.eventPayload(key));
    }
    return added;
  }

  async forget(key: string): Promise<boolean> {
    return this.store().forget(this.key(key));
  }

  async has(key: string): Promise<boolean> {
    return this.store().has(this.key(key));
  }

  async flush(): Promise<void> {
    await this.store().flush();
  }

  async remember<T>(
    key: string,
    ttlSeconds: number,
    callback: () => T | Promise<T>,
    lockSeconds = 10,
  ): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== null) {
      return existing;
    }

    const inflight = this.pendingRemember.get(key);
    if (inflight) {
      return inflight as Promise<T>;
    }

    const computation = this.rememberWithLock(key, ttlSeconds, callback, lockSeconds);
    this.pendingRemember.set(key, computation);

    try {
      return await computation;
    } finally {
      this.pendingRemember.delete(key);
    }
  }

  private async rememberWithLock<T>(
    key: string,
    ttlSeconds: number,
    callback: () => T | Promise<T>,
    lockSeconds: number,
  ): Promise<T> {
    const lock = this.lock(`remember:${key}`, lockSeconds);
    let value: T | undefined;

    try {
      await lock.block(lockSeconds, async () => {
        const cached = await this.get<T>(key);
        if (cached !== null) {
          value = cached;
          return;
        }
        value = await callback();
        await this.put(key, value, ttlSeconds);
      });
    } catch (error) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
      throw error;
    }

    if (value === undefined) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
      throw new Error(`Cache remember callback did not produce a value for [${key}].`);
    }

    return value;
  }

  lock(name: string, seconds = 0): CacheLock {
    return new CacheLock(this.store(), this.key(`lock:${name}`), seconds);
  }

  tags(names: string[]): TaggedCache {
    return new TaggedCache(this, names);
  }

  private tagIndexKey(tag: string): string {
    return `__tag:${tag}`;
  }

  async trackTaggedKey(tags: string[], key: string): Promise<void> {
    for (const tag of tags) {
      const indexKey = this.tagIndexKey(tag);
      const existing = await this.store().get<string[]>(this.key(indexKey)) ?? [];
      if (!existing.includes(key)) {
        await this.store().put(this.key(indexKey), [...existing, key]);
      }
    }
  }

  async untrackTaggedKey(tags: string[], key: string): Promise<void> {
    for (const tag of tags) {
      const indexKey = this.tagIndexKey(tag);
      const existing = await this.store().get<string[]>(this.key(indexKey));
      if (!existing) {
        continue;
      }
      const next = existing.filter((entry) => entry !== key);
      if (next.length === 0) {
        await this.store().forget(this.key(indexKey));
      } else {
        await this.store().put(this.key(indexKey), next);
      }
    }
  }

  async keysForTags(tags: string[]): Promise<string[]> {
    const keys = new Set<string>();
    for (const tag of tags) {
      const indexKey = this.tagIndexKey(tag);
      const entries = await this.store().get<string[]>(this.key(indexKey)) ?? [];
      for (const entry of entries) {
        keys.add(entry);
      }
    }
    return [...keys];
  }

  async clearTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.store().forget(this.key(this.tagIndexKey(tag)));
    }
  }
}