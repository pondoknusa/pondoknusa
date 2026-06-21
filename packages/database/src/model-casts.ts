export type CastType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'json'
  | 'array'
  | 'datetime';

export type ModelCastMap = Record<string, CastType>;

export function castAttribute(value: unknown, type: CastType): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case 'string':
      return String(value);
    case 'number': {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    }
    case 'boolean':
      if (typeof value === 'boolean') {
        return value;
      }
      if (value === 0 || value === '0' || value === 'false') {
        return false;
      }
      return Boolean(value);
    case 'json':
    case 'array':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return value;
        }
      }
      return value;
    case 'datetime':
      if (value instanceof Date) {
        return value;
      }
      if (typeof value === 'number') {
        return new Date(value * 1000);
      }
      if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? value : parsed;
      }
      return value;
    default:
      return value;
  }
}

export function serializeCast(value: unknown, type: CastType): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case 'json':
    case 'array':
      return typeof value === 'string' ? value : JSON.stringify(value);
    case 'datetime':
      if (value instanceof Date) {
        return Math.floor(value.getTime() / 1000);
      }
      return value;
    case 'boolean':
      return value ? 1 : 0;
    default:
      return value;
  }
}

export function applyCastsToAttributes(
  attributes: Record<string, unknown>,
  casts: ModelCastMap,
): Record<string, unknown> {
  const result = { ...attributes };

  for (const [key, type] of Object.entries(casts)) {
    if (key in result) {
      result[key] = castAttribute(result[key], type);
    }
  }

  return result;
}

export function serializeAttributesForStorage(
  attributes: Record<string, unknown>,
  casts: ModelCastMap,
): Record<string, unknown> {
  const result = { ...attributes };

  for (const [key, type] of Object.entries(casts)) {
    if (key in result) {
      result[key] = serializeCast(result[key], type);
    }
  }

  return result;
}