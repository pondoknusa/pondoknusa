import { Response } from './response.js';
import type { PondoknusaRequest } from './request.js';
import type { Middleware } from './types.js';

export interface ThrottleOptions {
  limit: number;
  windowMs: number;
  key?: (request: PondoknusaRequest) => string;
}

interface ThrottleEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, ThrottleEntry>();
const MAX_STORE_SIZE = 10_000;
let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;

export function createThrottleMiddleware(options: ThrottleOptions): Middleware {
  return async (request, next) => {
    sweepExpiredEntries();
    const key = options.key?.(request) ?? `${request.ip()}:${request.method}:${request.path}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      evictIfNeeded();
      return next();
    }

    if (entry.count >= options.limit) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return Response.json(
        { message: 'Too many requests.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        },
      );
    }

    entry.count += 1;
    store.set(key, entry);
    return next();
  };
}

function sweepExpiredEntries(): void {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) {
    return;
  }

  lastSweepAt = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

function evictIfNeeded(): void {
  if (store.size <= MAX_STORE_SIZE) {
    return;
  }

  const oldest = store.keys().next().value;
  if (oldest !== undefined) {
    store.delete(oldest);
  }
}

export function resetThrottleStore(): void {
  store.clear();
  lastSweepAt = 0;
}

export interface ThrottlePresetMap {
  [preset: string]: ThrottleOptions;
}

export function throttleMiddlewareAlias(preset: string): string {
  return `throttle:${preset}`;
}

export function registerThrottlePresets(
  register: (name: string, middleware: Middleware) => void,
  presets: ThrottlePresetMap,
): void {
  for (const [name, options] of Object.entries(presets)) {
    register(throttleMiddlewareAlias(name), createThrottleMiddleware(options));
  }
}
