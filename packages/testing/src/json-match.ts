export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Laravel-style partial JSON match (expected must be contained in actual).
 */
export function jsonContains(actual: JsonValue, expected: JsonValue): boolean {
  if (expected === null || typeof expected !== 'object' || Array.isArray(expected)) {
    if (Array.isArray(expected) && Array.isArray(actual)) {
      return expected.every((item, index) => jsonContains(actual[index] as JsonValue, item));
    }
    return actual === expected;
  }

  if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) {
    return false;
  }

  const expectedObj = expected as Record<string, JsonValue>;
  const actualObj = actual as Record<string, JsonValue>;

  for (const key of Object.keys(expectedObj)) {
    if (!(key in actualObj)) {
      return false;
    }
    if (!jsonContains(actualObj[key] as JsonValue, expectedObj[key] as JsonValue)) {
      return false;
    }
  }

  return true;
}