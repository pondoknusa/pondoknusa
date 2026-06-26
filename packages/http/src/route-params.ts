import type { RouteParams } from './types.js';

export function routeParamKey(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'object') {
    if ('getKey' in value && typeof (value as { getKey: () => unknown }).getKey === 'function') {
      return String((value as { getKey: () => unknown }).getKey());
    }

    if ('getAttribute' in value && typeof (value as { getAttribute: (key: string) => unknown }).getAttribute === 'function') {
      const model = value as { getAttribute: (key: string) => unknown; constructor?: { primaryKey?: string } };
      const primaryKey = model.constructor?.primaryKey ?? 'id';
      const id = model.getAttribute(primaryKey);
      if (id !== undefined && id !== null) {
        return String(id);
      }
    }
  }

  return String(value);
}

export function normalizeRouteParams(params: Record<string, unknown>): RouteParams {
  const normalized: RouteParams = {};

  for (const [key, value] of Object.entries(params)) {
    normalized[key] = routeParamKey(value);
  }

  return normalized;
}