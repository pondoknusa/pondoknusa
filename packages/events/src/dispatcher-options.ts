import type { Job } from '@tyravel/queue';
import type { EventRegistry } from './event-registry.js';
import type { ListenerRegistry } from './listener-registry.js';
import type { QueuedListenerMetadata } from './should-queue.js';

export interface QueuedListenerBridge {
  dispatch(
    job: Job,
    options: { connection: string; queue: string; delaySeconds: number },
  ): Promise<void>;
}

export interface EventDispatcherOptions {
  container?: import('@tyravel/container').Container;
  eventRegistry?: EventRegistry;
  listenerRegistry?: ListenerRegistry;
  queue?: QueuedListenerBridge;
  queueDefaults?: QueuedListenerMetadata & { connection?: string };
}