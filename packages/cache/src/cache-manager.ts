import type { RedisManager } from '@tyravel/redis';
import { ArrayStore } from './array-store.js';
import { FileStore } from './file-store.js';
import { RedisStore } from './redis-store.js';
import type { CacheConfig, CacheConnectionConfig, CacheStore } from './types.js';

export class CacheManager {
  private readonly stores = new Map<string, CacheStore>();

  constructor(
    private readonly config: CacheConfig,
    private readonly redis?: RedisManager,
  ) {}

  store(name?: string): CacheStore {
    const connection = name ?? this.config.default;
    const existing = this.stores.get(connection);
    if (existing) {
      return existing;
    }

    const config = this.config.connections[connection];
    if (!config) {
      throw new Error(`Cache connection [${connection}] is not configured.`);
    }

    const store = this.buildStore(config);
    this.stores.set(connection, store);
    return store;
  }

  private buildStore(config: CacheConnectionConfig): CacheStore {
    switch (config.driver) {
      case 'array':
        return new ArrayStore();
      case 'file':
        return new FileStore(config.path);
      case 'redis': {
        if (!this.redis) {
          throw new Error('Redis manager is required for the redis cache driver');
        }
        return new RedisStore(
          this.redis,
          config.connection ?? 'default',
          config.prefix ?? this.config.prefix,
        );
      }
      default:
        throw new Error(`Unsupported cache driver.`);
    }
  }

  prefixKey(key: string): string {
    const prefix = this.config.prefix ?? '';
    return prefix ? `${prefix}:${key}` : key;
  }
}