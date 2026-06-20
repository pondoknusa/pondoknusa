export type ConfigTree = Record<string, unknown>;

export class ConfigRepository {
  constructor(private readonly config: ConfigTree) {}

  all(): ConfigTree {
    return this.config;
  }

  get<T = unknown>(key: string, fallback?: T): T {
    const value = this.resolve(key);
    if (value === undefined) {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Config key not found: ${key}`);
    }
    return value as T;
  }

  has(key: string): boolean {
    return this.resolve(key) !== undefined;
  }

  private resolve(key: string): unknown {
    return key.split('.').reduce<unknown>((current, segment) => {
      if (current && typeof current === 'object' && segment in current) {
        return (current as Record<string, unknown>)[segment];
      }
      return undefined;
    }, this.config);
  }
}