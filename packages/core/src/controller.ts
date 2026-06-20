import type { Constructor } from '@tyravel/container';
import type { RouteHandler, TyravelRequest } from '@tyravel/http';
import { Response } from '@tyravel/http';
import type { Application } from './application.js';

export type ControllerConstructor = Constructor<object>;
export type ControllerAction = [ControllerConstructor, string];

export function isControllerAction(handler: unknown): handler is ControllerAction {
  return (
    Array.isArray(handler) &&
    handler.length === 2 &&
    typeof handler[0] === 'function' &&
    typeof handler[1] === 'string'
  );
}

export function createControllerHandler(
  app: Application,
  action: ControllerAction,
): RouteHandler {
  const [Controller, method] = action;

  return async (request: TyravelRequest) => {
    const controller = app.make(Controller);
    const handler = (controller as Record<string, unknown>)[method];

    if (typeof handler !== 'function') {
      throw new Error(`Controller action not found: ${Controller.name}@${method}`);
    }

    const result = await (handler as (request: TyravelRequest) => unknown).call(
      controller,
      request,
    );
    return normalizeControllerResult(result);
  };
}

const WebResponse = globalThis.Response;

function normalizeControllerResult(result: unknown): Response {
  if (result instanceof WebResponse) {
    return result;
  }

  if (result === undefined || result === null) {
    return Response.noContent();
  }

  return Response.json(result);
}