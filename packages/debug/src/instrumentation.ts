import { getCurrentDebugRequestId, stampJob } from './correlation.js';
import { recordDebugEvent } from './context.js';

export interface CacheStoreLike {
  get<T = unknown>(key: string): Promise<T | null>;
  put(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  add(key: string, value: unknown, ttlSeconds?: number): Promise<boolean>;
  forget(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  flush(): Promise<void>;
}

export interface DispatcherLike {
  dispatch(
    job: { constructor: { name: string }; data: Record<string, unknown> },
    queue?: string,
  ): Promise<string>;
  dispatchLater(
    delaySeconds: number,
    job: { constructor: { name: string }; data: Record<string, unknown> },
    queue?: string,
  ): Promise<string>;
  chain(jobs: unknown[], queue?: string): unknown;
  batch(jobs: unknown[], queue?: string): unknown;
}

export interface EventDispatcherLike {
  dispatch(event: { constructor: { name: string } }): Promise<void>;
}

export interface BroadcasterLike {
  broadcast(payload: { event: string; channels: string[] }): Promise<void>;
}

export interface MailLike {
  send(mailable: { constructor: { name: string } }): Promise<unknown>;
}

export interface NotificationManagerLike {
  send(notifiable: unknown, notification: { constructor: { name: string } }): Promise<void>;
  sendNow(notifiable: unknown, notification: { constructor: { name: string } }): Promise<void>;
}

async function timed<T>(
  type: Parameters<typeof recordDebugEvent>[0],
  label: string,
  callback: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  const start = performance.now();
  try {
    return await callback();
  } finally {
    recordDebugEvent(type, label, {
      durationMs: performance.now() - start,
      metadata,
    });
  }
}

export function instrumentCacheStore<T extends CacheStoreLike>(store: T): T {
  return {
    get: (key) => timed('cache', `get ${key}`, () => store.get(key), { key, op: 'get' }),
    put: (key, value, ttlSeconds) =>
      timed('cache', `put ${key}`, () => store.put(key, value, ttlSeconds), {
        key,
        op: 'put',
        ttlSeconds,
      }),
    add: (key, value, ttlSeconds) =>
      timed('cache', `add ${key}`, () => store.add(key, value, ttlSeconds), {
        key,
        op: 'add',
        ttlSeconds,
      }),
    forget: (key) =>
      timed('cache', `forget ${key}`, () => store.forget(key), { key, op: 'forget' }),
    has: (key) => timed('cache', `has ${key}`, () => store.has(key), { key, op: 'has' }),
    flush: () => timed('cache', 'flush', () => store.flush(), { op: 'flush' }),
  } as T;
}

export function instrumentDispatcher<T extends DispatcherLike>(dispatcher: T): T {
  return {
    dispatch: (job, queue) => {
      stampJob(job);
      const requestId = getCurrentDebugRequestId();
      return timed(
        'queue',
        job.constructor.name,
        () => dispatcher.dispatch(job, queue),
        { queue: queue ?? 'default', op: 'dispatch', requestId },
      );
    },
    dispatchLater: (delaySeconds, job, queue) => {
      stampJob(job);
      const requestId = getCurrentDebugRequestId();
      return timed(
        'queue',
        job.constructor.name,
        () => dispatcher.dispatchLater(delaySeconds, job, queue),
        { queue: queue ?? 'default', delaySeconds, op: 'dispatchLater', requestId },
      );
    },
    chain: (jobs, queue) => dispatcher.chain(jobs, queue),
    batch: (jobs, queue) => dispatcher.batch(jobs, queue),
  } as T;
}

export function instrumentEventDispatcher<T extends EventDispatcherLike>(dispatcher: T): T {
  return {
    dispatch: (event) =>
      timed(
        'event',
        event.constructor.name,
        () => dispatcher.dispatch(event),
        { op: 'dispatch', requestId: getCurrentDebugRequestId() },
      ),
  } as T;
}

export function instrumentBroadcaster<T extends BroadcasterLike>(broadcaster: T): T {
  return {
    broadcast: (payload) =>
      timed(
        'broadcast',
        payload.event,
        () => broadcaster.broadcast(payload),
        { channels: payload.channels, op: 'broadcast' },
      ),
  } as T;
}

export function instrumentMailer<T extends MailLike>(mailer: T): T {
  return new Proxy(mailer, {
    get(target, property, receiver) {
      if (property === 'send') {
        return async (mailable: { constructor: { name: string } }) =>
          timed(
            'mail',
            mailable.constructor.name,
            () => Reflect.get(target, property, receiver).call(target, mailable),
            { op: 'send' },
          );
      }
      return Reflect.get(target, property, receiver);
    },
  });
}

export function instrumentNotificationManager<T extends NotificationManagerLike>(
  manager: T,
): T {
  return new Proxy(manager, {
    get(target, property, receiver) {
      if (property === 'send' || property === 'sendNow') {
        return async (notifiable: unknown, notification: { constructor: { name: string } }) =>
          timed(
            'notification',
            notification.constructor.name,
            () => Reflect.get(target, property, receiver).call(target, notifiable, notification),
            { op: property },
          );
      }
      return Reflect.get(target, property, receiver);
    },
  });
}