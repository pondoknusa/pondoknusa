import type { MiddlewareInput } from './middleware-registry.js';
import type { Router } from './router.js';
import {
  applyRouteGroupOptions,
  type RouteGroupOptions,
} from './route-group-options.js';
import type {
  HttpMethod,
  Middleware,
  RouteHandler,
  RouteParams,
} from './types.js';

export type { RouteGroupOptions } from './route-group-options.js';

export interface RouteScope {
  prefix: string;
  middleware: MiddlewareInput[];
  namePrefix?: string;
}

export interface Routable {
  get(pattern: string, handler: RouteHandler): Routable;
  post(pattern: string, handler: RouteHandler): Routable;
  put(pattern: string, handler: RouteHandler): Routable;
  patch(pattern: string, handler: RouteHandler): Routable;
  delete(pattern: string, handler: RouteHandler): Routable;
  use(...middleware: MiddlewareInput[]): Routable;
  name(name: string): Routable;
  throttle(preset: string): Routable;
  url(name: string, params?: RouteParams): string;
}

export interface ScopedRouteRegistrar {
  get(pattern: string, handler: RouteHandler): Routable;
  post(pattern: string, handler: RouteHandler): Routable;
  put(pattern: string, handler: RouteHandler): Routable;
  patch(pattern: string, handler: RouteHandler): Routable;
  delete(pattern: string, handler: RouteHandler): Routable;
}

export interface Groupable extends Routable {
  prefix(prefix: string): MiddlewareGroupable;
  namePrefix(prefix: string): MiddlewareGroupable;
  group(callback: (routes: Groupable) => void): Routable;
}

export interface MiddlewareGroupable extends Groupable {
  middleware(...middleware: MiddlewareInput[]): MiddlewareGroupable;
}

export function joinRoutePaths(...segments: string[]): string {
  const parts = segments.flatMap((segment) => {
    const trimmed = segment.trim();
    if (!trimmed || trimmed === '/') {
      return [];
    }

    return [trimmed.replace(/^\/+|\/+$/g, '')];
  });

  if (parts.length === 0) {
    return '';
  }

  return `/${parts.join('/')}`;
}

export class RouteGroupBuilder implements MiddlewareGroupable {
  constructor(
    private readonly router: Router,
    private readonly scope: RouteScope = { prefix: '', middleware: [] },
  ) {}

  prefix(prefix: string): MiddlewareGroupable {
    return new RouteGroupBuilder(this.router, {
      ...this.scope,
      prefix: joinRoutePaths(this.scope.prefix, prefix),
    });
  }

  middleware(...middleware: MiddlewareInput[]): MiddlewareGroupable {
    return new RouteGroupBuilder(this.router, {
      ...this.scope,
      middleware: [...this.scope.middleware, ...middleware],
    });
  }

  namePrefix(prefix: string): MiddlewareGroupable {
    return new RouteGroupBuilder(this.router, {
      ...this.scope,
      namePrefix: prefix,
    });
  }

  group(callback: (routes: Groupable) => void): Routable {
    this.router.runInScope(this.scope, () => callback(this));
    return this.router;
  }

  get(pattern: string, handler: RouteHandler): Routable {
    return this.add('GET', pattern, handler);
  }

  post(pattern: string, handler: RouteHandler): Routable {
    return this.add('POST', pattern, handler);
  }

  put(pattern: string, handler: RouteHandler): Routable {
    return this.add('PUT', pattern, handler);
  }

  patch(pattern: string, handler: RouteHandler): Routable {
    return this.add('PATCH', pattern, handler);
  }

  delete(pattern: string, handler: RouteHandler): Routable {
    return this.add('DELETE', pattern, handler);
  }

  use(...middleware: MiddlewareInput[]): Routable {
    return this.router.use(...middleware);
  }

  name(name: string): Routable {
    return this.router.name(name);
  }

  throttle(preset: string): Routable {
    return this.router.throttle(preset);
  }

  url(name: string, params?: RouteParams): string {
    return this.router.url(name, params);
  }

  private add(method: HttpMethod, pattern: string, handler: RouteHandler): Routable {
    const scope = this.router.hasActiveScope()
      ? { prefix: '', middleware: [] as MiddlewareInput[] }
      : this.scope;
    return this.router.addScoped(scope, method, pattern, handler);
  }
}