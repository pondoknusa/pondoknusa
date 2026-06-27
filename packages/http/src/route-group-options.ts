import type { MiddlewareInput } from './middleware-registry.js';
import type { MiddlewareGroupable, RouteGroupBuilder } from './route-group.js';

export interface RouteGroupOptions {
  prefix?: string;
  middleware?: MiddlewareInput | MiddlewareInput[];
  /** Name prefix applied to routes registered inside the group. */
  name?: string;
  /** Alias for `name` (Laravel-style route name prefix). */
  as?: string;
}

export function normalizeMiddlewareInput(
  middleware?: MiddlewareInput | MiddlewareInput[],
): MiddlewareInput[] {
  if (!middleware) {
    return [];
  }

  return Array.isArray(middleware) ? middleware : [middleware];
}

export function applyRouteGroupOptions(
  builder: RouteGroupBuilder,
  options: RouteGroupOptions,
): MiddlewareGroupable {
  let current: MiddlewareGroupable = builder;

  if (options.prefix) {
    current = current.prefix(options.prefix);
  }

  const namePrefix = options.name ?? options.as;
  if (namePrefix) {
    current = current.namePrefix(namePrefix);
  }

  const middleware = normalizeMiddlewareInput(options.middleware);
  if (middleware.length > 0) {
    current = current.middleware(...middleware);
  }

  return current;
}