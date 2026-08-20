const SENSITIVE_LEAF =
  /^(pass(word|phrase)?|secret|token|api[_-]?key|private[_-]?key|public[_-]?key|credentials?|credential|dsn|connection[_-]?string|salt|encryption[_-]?key|access[_-]?key|client[_-]?secret|auth[_-]?key|signing[_-]?key|webhook[_-]?secret|key)$/i;

const SENSITIVE_URL_CONTEXT =
  /(^|\.)(database|db|redis|cache|mongo|mysql|postgres|amqp|broker|queue|smtp)(\.|$)/i;

const EXPLICIT_SENSITIVE_KEYS = new Set([
  'app.key',
  'app.encryption_key',
  'app.secret',
]);

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
  if (EXPLICIT_SENSITIVE_KEYS.has(key) || SENSITIVE_LEAF.test(key)) {
    return true;
  }

  const leaf = key.includes('.') ? (key.split('.').pop() ?? key) : key;
  if (SENSITIVE_LEAF.test(leaf)) {
    return true;
  }

  return /^(url|uri)$/i.test(leaf) && SENSITIVE_URL_CONTEXT.test(key);
}

export function redactConfigValue(key: string, value: unknown): unknown {
  if (isSensitiveConfigKey(key)) {
    return '[redacted]';
  }
  return value;
}
