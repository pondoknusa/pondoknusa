import type { ListenerConstructor, ListenerContract } from './types.js';

export class ListenerNotFoundException extends Error {
  constructor(name: string) {
    super(`Listener class not registered: ${name}`);
    this.name = 'ListenerNotFoundException';
  }
}

export class ListenerRegistry {
  private readonly listeners = new Map<string, ListenerConstructor>();

  register(constructor: ListenerConstructor): this {
    this.listeners.set(constructor.name, constructor);
    return this;
  }

  has(name: string): boolean {
    return this.listeners.has(name);
  }

  resolve(name: string): ListenerConstructor {
    const constructor = this.listeners.get(name);
    if (!constructor) {
      throw new ListenerNotFoundException(name);
    }
    return constructor;
  }

  create(name: string): ListenerContract {
    const constructor = this.resolve(name);
    return new constructor();
  }
}