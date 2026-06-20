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

export function createEventDispatcher(container?: Container): EventDispatcher {
  return new EventDispatcher({ container });
}

export { EventDispatcher } from './event-dispatcher.js';
export { Event, Listener } from './types.js';
export type {
  EventConstructor,
  EventDispatcherOptions,
  EventListenerRegistration,
  EventsConfig,
  ListenerCallback,
  ListenerConstructor,
  ListenerContract,
  ListenerHandler,
} from './types.js';