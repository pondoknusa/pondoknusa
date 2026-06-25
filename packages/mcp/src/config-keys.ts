const SENSITIVE_KEY = /(password|secret|token|private[_-]?key|api[_-]?key)/i;

export function flattenConfigKeys(
  config: Record<string, unknown>,
  prefix = '',
): string[] {
  const keys: string[] = [];

  for (const [segment, value] of Object.entries(config)) {
    if (segment === 'schema') {
      continue;
    }

    const key = prefix ? `${prefix}.${segment}` : segment;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenConfigKeys(value as Record<string, unknown>, key));
      continue;
    }

    keys.push(key);
  }

  return keys.sort();
}

export function isSensitiveConfigKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

export function redactConfigValue(key: string, value: unknown): unknown {
  if (isSensitiveConfigKey(key)) {
    return '[redacted]';
  }
  return value;
}