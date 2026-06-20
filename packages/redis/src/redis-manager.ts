import { createClient } from 'redis';
import type { RedisClient, RedisConfig, RedisConnectionConfig } from './types.js';

export class RedisManager {
  private readonly clients = new Map<string, RedisClient>();
  private readonly connecting = new Map<string, Promise<RedisClient>>();

  constructor(private readonly config: RedisConfig) {}

  async connection(name?: string): Promise<RedisClient> {
    const connectionName = name ?? this.config.default;
    const existing = this.clients.get(connectionName);
    if (existing) {
      return existing;
    }

    const pending = this.connecting.get(connectionName);
    if (pending) {
      return pending;
    }

    const connectionConfig = this.config.connections[connectionName];
    if (!connectionConfig) {
      throw new Error(`Redis connection [${connectionName}] is not configured.`);
    }

    const connectPromise = this.createClient(connectionConfig).then((client) => {
      this.clients.set(connectionName, client);
      this.connecting.delete(connectionName);
      return client;
    });

    this.connecting.set(connectionName, connectPromise);
    return connectPromise;
  }

  prefixKey(key: string): string {
    const prefix = this.config.prefix ?? '';
    return prefix ? `${prefix}:${key}` : key;
  }

  async close(name?: string): Promise<void> {
    if (name) {
      const client = this.clients.get(name);
      await client?.quit();
      this.clients.delete(name);
      return;
    }

    await Promise.all([...this.clients.values()].map((client) => client.quit()));
    this.clients.clear();
    this.connecting.clear();
  }

  private async createClient(config: RedisConnectionConfig): Promise<RedisClient> {
    const client = createClient(buildClientOptions(config));
    client.on('error', (error) => {
      process.stderr.write(`Redis error: ${String(error)}\n`);
    });
    await client.connect();
    return client as unknown as RedisClient;
  }
}

function buildClientOptions(config: RedisConnectionConfig) {
  if (config.url) {
    return { url: config.url };
  }

  return {
    socket: {
      host: config.host ?? '127.0.0.1',
      port: config.port ?? 6379,
    },
    username: config.username,
    password: config.password,
    database: config.database,
  };
}