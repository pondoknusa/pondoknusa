import { createHash } from 'node:crypto';

interface MemoEntry {
  html: string;
  expiresAt?: number;
}

export interface ComponentMemoCacheStore {
  get(key: string): string | null | Promise<string | null>;
  put(key: string, html: string, ttlSeconds?: number): void | Promise<void>;
}

export class InMemoryComponentMemoCache implements ComponentMemoCacheStore {
  private readonly entries = new Map<string, MemoEntry>();

  get(key: string): string | null {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }

    return entry.html;
  }

  put(key: string, html: string, ttlSeconds?: number): void {
    const expiresAt =
      ttlSeconds !== undefined && ttlSeconds > 0
        ? Date.now() + ttlSeconds * 1000
        : undefined;
    this.entries.set(key, { html, expiresAt });
  }

  /** Test helper — number of cached entries. */
  count(): number {
    return this.entries.size;
  }
}

export function hashComponentProps(props: Record<string, unknown>): string | undefined {
  try {
    const normalized = stableSerialize(props);
    return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  } catch {
    return undefined;
  }
}

export function buildComponentMemoKey(
  componentName: string,
  props: Record<string, unknown>,
): string | undefined {
  const propsHash = hashComponentProps(props);
  if (!propsHash) {
    return undefined;
  }

  return `${componentName}:${propsHash}`;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`;
}