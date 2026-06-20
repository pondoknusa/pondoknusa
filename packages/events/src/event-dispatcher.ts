import type { Constructor } from '@tyravel/container';
import type { Container } from '@tyravel/container';
import type { Event } from './types.js';
import {
  type EventConstructor,
  type ListenerCallback,
  type ListenerConstructor,
  type ListenerContract,
  type ListenerHandler,
} from './types.js';

export class EventDispatcher {
  private readonly listeners = new Map<string, ListenerHandler[]>();
  private readonly container?: Container;

  constructor(options: { container?: Container } = {}) {
    this.container = options.container;
  }

  listen<TEvent extends Event>(
    event: EventConstructor<TEvent>,
    handler: ListenerHandler<TEvent>,
  ): this {
    const key = event.name;
    const existing = this.listeners.get(key) ?? [];
    existing.push(handler as ListenerHandler);
    this.listeners.set(key, existing);
    return this;
  }

  listenMany(
    event: EventConstructor,
    handlers: ListenerHandler[],
  ): this {
    for (const handler of handlers) {
      this.listen(event, handler);
    }
    return this;
  }

  hasListeners(event: EventConstructor | Event): boolean {
    const key = typeof event === 'function' ? event.name : event.constructor.name;
    return (this.listeners.get(key)?.length ?? 0) > 0;
  }

  async dispatch<TEvent extends Event>(event: TEvent): Promise<void> {
    const key = event.constructor.name;
    const handlers = this.listeners.get(key) ?? [];

    for (const handler of handlers) {
      await this.invokeHandler(handler, event);
    }
  }

  async dispatchUntil<TEvent extends Event>(
    event: TEvent,
    predicate: (event: TEvent) => boolean,
  ): Promise<boolean> {
    const key = event.constructor.name;
    const handlers = this.listeners.get(key) ?? [];

    for (const handler of handlers) {
      await this.invokeHandler(handler, event);
      if (predicate(event)) {
        return true;
      }
    }

    return false;
  }

  forget(event: EventConstructor): this {
    this.listeners.delete(event.name);
    return this;
  }

  flush(): this {
    this.listeners.clear();
    return this;
  }

  private async invokeHandler<TEvent extends Event>(
    handler: ListenerHandler<TEvent>,
    event: TEvent,
  ): Promise<void> {
    if (this.isListenerCallback(handler)) {
      await handler(event);
      return;
    }

    const instance = this.resolveListener(handler);
    await instance.handle(event);
  }

  private resolveListener<TEvent extends Event>(
    constructor: ListenerHandler<TEvent>,
  ): ListenerContract<TEvent> {
    if (this.container && this.isListenerClass(constructor)) {
      return this.container.make(
        constructor as Constructor<ListenerContract<TEvent>>,
      );
    }

    if (this.isListenerClass(constructor)) {
      return new (constructor as ListenerConstructor<TEvent>)();
    }

    throw new Error('Invalid event listener handler.');
  }

  private isListenerCallback<TEvent extends Event>(
    handler: ListenerHandler<TEvent>,
  ): handler is ListenerCallback<TEvent> {
    return (
      typeof handler === 'function' &&
      (!('prototype' in handler) || typeof handler.prototype?.handle !== 'function')
    );
  }

  private isListenerClass<TEvent extends Event>(
    handler: ListenerHandler<TEvent>,
  ): handler is ListenerHandler<TEvent> & { prototype: { handle: Function } } {
    return (
      typeof handler === 'function' &&
      typeof handler.prototype?.handle === 'function'
    );
  }
}