import { createHmac, timingSafeEqual } from 'node:crypto';

const INTEGRITY_PREFIX = 'pn.sess.';

export class SessionIntegrity {
  constructor(private readonly key: string) {
    if (!key || key.length < 16) {
      throw new Error('Session integrity key must be at least 16 characters.');
    }
  }

  seal(data: Record<string, unknown>): string {
    const payload = JSON.stringify(data);
    const mac = createHmac('sha256', this.key).update(payload).digest('hex');
    return `${INTEGRITY_PREFIX}${mac}.${payload}`;
  }

  open(raw: string): Record<string, unknown> | null {
    if (!raw.startsWith(INTEGRITY_PREFIX)) {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return null;
      }
    }

    const body = raw.slice(INTEGRITY_PREFIX.length);
    const separator = body.indexOf('.');
    if (separator <= 0) {
      return null;
    }

    const mac = body.slice(0, separator);
    const payload = body.slice(separator + 1);
    const expected = createHmac('sha256', this.key).update(payload).digest('hex');

    try {
      if (
        mac.length !== expected.length ||
        !timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'))
      ) {
        return null;
      }
    } catch {
      return null;
    }

    try {
      return JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export function resolveSessionIntegrityKey(
  appKey?: string,
  fallbackKey?: string,
): string | undefined {
  return appKey ?? fallbackKey ?? process.env.APP_KEY;
}
