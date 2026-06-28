import type { ModelStatic } from './model-types.js';
import { getModelAttributeCache } from './model-attribute-cache.js';

export function buildQueryCacheKey(
  model: ModelStatic,
  key: string,
  prefix = 'model:query',
): string {
  const table = model.table || model.name.toLowerCase();
  return `${prefix}:${table}:${key}`;
}

export async function rememberQueryResult<T>(
  model: ModelStatic,
  key: string,
  ttlSeconds: number,
  callback: () => T | Promise<T>,
  prefix?: string,
): Promise<T> {
  const cache = getModelAttributeCache();
  const cacheKey = buildQueryCacheKey(model, key, prefix);

  if (cache.remember) {
    return cache.remember(cacheKey, ttlSeconds, callback);
  }

  const existing = await cache.get<T>(cacheKey);
  if (existing !== null) {
    return existing;
  }

  const value = await callback();
  await cache.put(cacheKey, value, ttlSeconds);
  return value;
}

export async function forgetQueryResult(
  model: ModelStatic,
  key: string,
  prefix?: string,
): Promise<void> {
  const cache = getModelAttributeCache();
  const cacheKey = buildQueryCacheKey(model, key, prefix);

  if (cache.forget) {
    await cache.forget(cacheKey);
    return;
  }

  await cache.put(cacheKey, null, 0);
}