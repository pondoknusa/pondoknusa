export type MetadataFilterOperator = 'eq' | 'contains' | 'exists';

export interface MetadataFilter {
  key: string;
  value?: unknown;
  operator?: MetadataFilterOperator;
}

export function parseMetadataColumn(value: unknown): Record<string, unknown> | undefined {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function matchesMetadataFilters(
  metadata: Record<string, unknown> | undefined,
  filters: MetadataFilter[],
): boolean {
  if (filters.length === 0) {
    return true;
  }

  if (!metadata) {
    return false;
  }

  return filters.every((filter) => {
    const operator = filter.operator ?? 'eq';
    const actual = metadata[filter.key];

    if (operator === 'exists') {
      return actual !== undefined && actual !== null;
    }

    if (operator === 'contains') {
      return String(actual ?? '').toLowerCase().includes(String(filter.value ?? '').toLowerCase());
    }

    return actual === filter.value;
  });
}