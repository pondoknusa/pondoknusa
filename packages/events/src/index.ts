import type { Container } from '@tyravel/container';
import { EventDispatcher } from './event-dispatcher.js';
import type {
  EventListenerRegistration,
  EventsConfig,
} from './types.js';

export abstract class EventSubscriber {
  abstract subscribe(dispatcher: EventDispatcher): void;
}

export function registerEventListeners(
  dispatcher: EventDispatcher,
  registrations: EventListenerRegistration[],
): void {
  for (const [event, handlers] of registrations) {
    dispatcher.listenMany(event, handlers);
  }
}

export function registerEventsConfig(
  dispatcher: EventDispatcher,
  config: EventsConfig,
): void {
  registerEventListeners(dispatcher, config.listen);
}

export function createEventDispatcher(
  options: import('./dispatcher-options.js').EventDispatcherOptions = {},
): EventDispatcher {
  return new EventDispatcher(options);
}

export { CallQueuedListener } from './call-queued-listener.js';
export type { CallQueuedListenerData } from './call-queued-listener.js';
export { EventDispatcher } from './event-dispatcher.js';
export { EventRegistry } from './event-registry.js';
export { ListenerRegistry } from './listener-registry.js';
export {
  clearQueuedListenerContext,
  getQueuedListenerContext,
  setQueuedListenerContext,
} from './queued-listener-context.js';
export type { QueuedListenerContext } from './queued-listener-context.js';
export {
  QueuedListener,
  buildCallQueuedListenerJob,
  listenerShouldQueue,
  resolveQueuedListenerMetadata,
} from './should-queue.js';
export type {
  QueuedListenerBridge,
} from './dispatcher-options.js';
export type { EventDispatcherOptions } from './dispatcher-options.js';
export { Event, Listener } from './types.js';
export type {
  EventConstructor,
  EventListenerRegistration,
  EventsConfig,
  ListenerCallback,
  ListenerConstructor,
  ListenerContract,
  ListenerHandler,
  ShouldQueue,
} from './types.js';
export type {
  QueuedListenerConstructor,
  QueuedListenerMetadata,
} from './should-queue.js';