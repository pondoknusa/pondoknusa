import { Response } from './response.js';
import type { PondoknusaRequest } from './request.js';
import type { Middleware } from './types.js';

export interface ThrottleEntry {
  count: number;
  resetAt: number;
}

/**
 * Pluggable counter store for rate limiting.
 *
 * The default in-memory store is process-local: it resets on restart and does
 * not share state across workers or instances. Pass a shared store (e.g. Redis)
 * in multi-node deployments.
 */
export interface ThrottleStore {
  get(key: string): ThrottleEntry | undefined | Promise<ThrottleEntry | undefined>;
  set(key: string, entry: ThrottleEntry): void | Promise<void>;
}

export interface ThrottleOptions {
  limit: number;
  windowMs: number;
  key?: (request: PondoknusaRequest) => string;
  /** Defaults to a process-local Map. */
  store?: ThrottleStore;
}

const memoryStore = new Map<string, ThrottleEntry>();
const MAX_STORE_SIZE = 10_000;
let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;

const defaultStore: ThrottleStore = {
  get(key) {
    return memoryStore.get(key);
  },
  set(key, entry) {
    memoryStore.set(key, entry);
  },
};

export function createThrottleMiddleware(options: ThrottleOptions): Middleware {
  const store = options.store ?? defaultStore;

  return async (request, next) => {
    sweepExpiredEntries();
    const key = options.key?.(request) ?? `${request.ip()}:${request.method}:${request.path}`;
    const now = Date.now();
    const entry = await store.get(key);

    if (!entry || entry.resetAt <= now) {
      await store.set(key, {
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
    await store.set(key, entry);
    return next();
  };
}

function sweepExpiredEntries(): void {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) {
    return;
  }

  lastSweepAt = now;
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}

function evictIfNeeded(): void {
  if (memoryStore.size <= MAX_STORE_SIZE) {
    return;
  }

  const oldest = memoryStore.keys().next().value;
  if (oldest !== undefined) {
    memoryStore.delete(oldest);
  }
}

export function resetThrottleStore(): void {
  memoryStore.clear();
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
