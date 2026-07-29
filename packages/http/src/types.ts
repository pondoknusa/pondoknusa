import type { MiddlewareInput } from './middleware-registry.js';
import type { PondoknusaRequest } from './request.js';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export type RouteParamValue = string | object;
export type RouteParams = Record<string, RouteParamValue>;

export type RouteHandler = (
  request: PondoknusaRequest,
) => Response | Promise<Response>;

export type Middleware = (
  request: PondoknusaRequest,
  next: () => Promise<Response>,
) => Promise<Response>;

export interface RouteDefinition {
  method: HttpMethod;
  pattern: string;
  handler: RouteHandler;
  handlerLabel?: string;
  name?: string;
  namePrefix?: string;
  middleware: Middleware[];
  middlewareLabels?: string[];
  /**
   * Unresolved middleware as registered (alias strings included). Resolved
   * lazily on first route-table compile — after all service providers have
   * booted — so routes may reference aliases before providers register them.
   * Cleared once resolved into {@link middleware}.
   */
  middlewareInputs?: MiddlewareInput[];
}