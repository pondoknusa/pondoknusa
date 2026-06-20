import type { Middleware } from './types.js';

export class MiddlewareNotFoundException extends Error {
  constructor(name: string) {
    super(`Middleware not found: ${name}`);
    this.name = 'MiddlewareNotFoundException';
  }
}

export type MiddlewareInput = Middleware | string;

export class MiddlewareRegistry {
  private aliases = new Map<string, Middleware>();

  alias(name: string, middleware: Middleware): this {
    this.aliases.set(name, middleware);
    return this;
  }

  has(name: string): boolean {
    return this.aliases.has(name);
  }

  resolve(input: MiddlewareInput): Middleware {
    if (typeof input !== 'string') {
      return input;
    }

    const middleware = this.aliases.get(input);
    if (!middleware) {
      throw new MiddlewareNotFoundException(input);
    }

    return middleware;
  }

  resolveMany(inputs: MiddlewareInput[]): Middleware[] {
    return inputs.map((input) => this.resolve(input));
  }
}