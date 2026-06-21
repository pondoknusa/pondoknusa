interface CacheEntry {
  value: string;
  expiresAt?: number;
}

export interface FragmentCacheStore {
  get(key: string): string | null | Promise<string | null>;
  put(key: string, value: string, ttlSeconds?: number): void | Promise<void>;
}

export class InMemoryFragmentCache implements FragmentCacheStore {
  private readonly entries = new Map<string, CacheEntry>();

  get(key: string): string | null {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }

    return entry.value;
  }

  put(key: string, value: string, ttlSeconds?: number): void {
    const expiresAt =
      ttlSeconds !== undefined && ttlSeconds > 0
        ? Date.now() + ttlSeconds * 1000
        : undefined;
    this.entries.set(key, { value, expiresAt });
  }
}