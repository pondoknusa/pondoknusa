import { localizedRouteGroup } from '@tyravel/locale';
import type {
  Groupable,
  MiddlewareGroupable,
  MiddlewareInput,
  RouteHandler,
  Routable,
  Router,
  ScopedRouteRegistrar,
} from '@tyravel/http';
import type { ControllerAction } from './controller.js';
import type { Application } from './application.js';

let activeApp: Application | undefined;

export function setRouteApplication(app: Application): void {
  activeApp = app;
}

function router(): Router {
  if (!activeApp) {
    throw new Error(
      'Route facade is not ready. Boot the application before defining routes.',
    );
  }
  return activeApp.router();
}

type RouteTarget = RouteHandler | ControllerAction;

function toHandler(handler: RouteTarget): RouteHandler {
  return handler as RouteHandler;
}

export interface RouteFacade {
  prefix(prefix: string): MiddlewareGroupable;
  namePrefix(prefix: string): MiddlewareGroupable;
  group(callback: (routes: Groupable) => void): Routable;
  localize(callback: (routes: Groupable) => void): Routable;
  get(pattern: string, handler: RouteTarget): Routable;
  post(pattern: string, handler: RouteTarget): Routable;
  put(pattern: string, handler: RouteTarget): Routable;
  patch(pattern: string, handler: RouteTarget): Routable;
  delete(pattern: string, handler: RouteTarget): Routable;
  middleware(...middleware: MiddlewareInput[]): ScopedRouteRegistrar;
  use(...middleware: MiddlewareInput[]): Routable;
  name(name: string): Routable;
  url(name: string, params?: Parameters<Router['url']>[1]): string;
}

export const Route: RouteFacade = {
  prefix: (prefix: string): MiddlewareGroupable => router().prefix(prefix),
  namePrefix: (prefix: string): MiddlewareGroupable => router().namePrefix(prefix),
  group: (callback: (routes: Groupable) => void): Routable => router().group(callback),
  localize: (callback: (routes: Groupable) => void): Routable => {
    localizedRouteGroup(router(), {}, callback);
    return router();
  },
  get: (pattern: string, handler: RouteTarget): Routable =>
    router().get(pattern, toHandler(handler)),
  post: (pattern: string, handler: RouteTarget): Routable =>
    router().post(pattern, toHandler(handler)),
  put: (pattern: string, handler: RouteTarget): Routable =>
    router().put(pattern, toHandler(handler)),
  patch: (pattern: string, handler: RouteTarget): Routable =>
    router().patch(pattern, toHandler(handler)),
  delete: (pattern: string, handler: RouteTarget): Routable =>
    router().delete(pattern, toHandler(handler)),
  middleware: (...middleware: MiddlewareInput[]): ScopedRouteRegistrar =>
    router().middleware(...middleware),
  use: (...middleware: MiddlewareInput[]): Routable => router().use(...middleware),
  name: (name: string): Routable => router().name(name),
  url: (name: string, params?) => router().url(name, params),
};