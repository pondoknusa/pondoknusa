import type { Event } from './types.js';
import type { EventConstructor } from './types.js';

export class EventNotFoundException extends Error {
  constructor(name: string) {
    super(`Event class not registered: ${name}`);
    this.name = 'EventNotFoundException';
  }
}

export class EventRegistry {
  private readonly events = new Map<string, EventConstructor>();

  register(constructor: EventConstructor): this {
    this.events.set(constructor.name, constructor);
    return this;
  }

  has(name: string): boolean {
    return this.events.has(name);
  }

  resolve(name: string): EventConstructor {
    const constructor = this.events.get(name);
    if (!constructor) {
      throw new EventNotFoundException(name);
    }
    return constructor;
  }

  create(name: string, data: Record<string, unknown>): Event {
    const constructor = this.resolve(name);
    return new constructor(data);
  }
}