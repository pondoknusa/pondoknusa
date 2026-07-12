const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function isDangerousKey(key: string): boolean {
  return DANGEROUS_KEYS.has(key);
}

export function safeObject<T extends Record<string, unknown> = Record<string, unknown>>(): T {
  return Object.create(null) as T;
}

export function safeSpread<T extends Record<string, unknown>>(
  source: Partial<T> | undefined | null,
): T {
  const result = safeObject<T>();
  if (!source || typeof source !== 'object') {
    return result;
  }

  for (const key of Object.keys(source)) {
    if (!isDangerousKey(key)) {
      result[key as keyof T] = source[key as keyof T] as T[keyof T];
    }
  }

  return result;
}

export function safeGet(
  obj: Record<string, unknown> | null | undefined,
  key: string,
): unknown {
  if (!obj || isDangerousKey(key)) {
    return undefined;
  }

  return Object.hasOwn(obj, key) ? obj[key] : undefined;
}

const SENSITIVE_KEY_PATTERN =
  /password|secret|token|authorization|api[_-]?key|credential/i;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

export function redactSensitive(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 8) {
    return '[REDACTED]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitive(entry, depth + 1));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? '[REDACTED]' : redactSensitive(entry, depth + 1);
    }
    return result;
  }

  return value;
}

export function redactSensitiveString(body: string): string {
  try {
    const parsed = JSON.parse(body) as unknown;
    return JSON.stringify(redactSensitive(parsed));
  } catch {
    return body.replace(
      /("(password|secret|token|api[_-]?key)"\s*:\s*)"[^"]*"/gi,
      '$1"[REDACTED]"',
    );
  }
}

const MAX_JSON_DEPTH = 64;

export function parseJsonSafe(
  text: string,
  maxDepth = MAX_JSON_DEPTH,
): unknown {
  return JSON.parse(text, createDepthReviver(maxDepth));
}

function createDepthReviver(maxDepth: number) {
  let depth = 0;

  return function reviver(this: unknown, key: string, value: unknown): unknown {
    if (key === '') {
      return value;
    }

    depth += 1;
    if (depth > maxDepth) {
      throw new SyntaxError('JSON depth limit exceeded');
    }

    return value;
  };
}
