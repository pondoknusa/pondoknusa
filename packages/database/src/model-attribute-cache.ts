import type { ModelStatic } from './model-types.js';

export interface AttributeCacheStore {
  get<T = unknown>(key: string): Promise<T | null>;
  put(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  forget?(key: string): Promise<boolean>;
  remember?<T>(
    key: string,
    ttlSeconds: number,
    callback: () => T | Promise<T>,
  ): Promise<T>;
}

let cacheResolver: (() => AttributeCacheStore) | undefined;

export function setModelAttributeCacheResolver(
  resolver: () => AttributeCacheStore,
): void {
  cacheResolver = resolver;
}

export function clearModelAttributeCacheResolver(): void {
  cacheResolver = undefined;
}

export function getModelAttributeCache(): AttributeCacheStore {
  if (!cacheResolver) {
    throw new Error(
      'Model attribute cache not configured. Call Model.setCacheResolver() or setModelAttributeCacheResolver() first.',
    );
  }
  return cacheResolver();
}

export function buildAttributeCacheKey(
  model: ModelStatic,
  id: unknown,
  attribute: string,
  prefix = 'model:attribute',
): string {
  const table = model.table || model.name.toLowerCase();
  return `${prefix}:${table}:${String(id)}:${attribute}`;
}

export async function rememberModelAttribute<T>(
  model: ModelStatic,
  id: unknown,
  attribute: string,
  ttlSeconds: number,
  callback: () => T | Promise<T>,
  prefix?: string,
): Promise<T> {
  const cache = getModelAttributeCache();
  const key = buildAttributeCacheKey(model, id, attribute, prefix);

  if (cache.remember) {
    return cache.remember(key, ttlSeconds, callback);
  }

  const existing = await cache.get<T>(key);
  if (existing !== null) {
    return existing;
  }

  const value = await callback();
  await cache.put(key, value, ttlSeconds);
  return value;
}

export async function forgetModelAttribute(
  model: ModelStatic,
  id: unknown,
  attribute: string,
  prefix?: string,
): Promise<void> {
  const cache = getModelAttributeCache();
  const key = buildAttributeCacheKey(model, id, attribute, prefix);

  if (cache.forget) {
    await cache.forget(key);
    return;
  }

  await cache.put(key, null, 0);
}