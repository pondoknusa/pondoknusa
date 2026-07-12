import type { PondoknusaRequest } from './request.js';
import type { Middleware, RouteHandler } from './types.js';

/**
 * Pre-composed middleware runner with a stable handler reference per route.
 */
export class RoutePipelineRunner {
  constructor(
    private readonly middleware: Middleware[],
    private readonly handler: RouteHandler,
  ) {}

  run(request: PondoknusaRequest): Promise<Response> {
    let index = 0;

    const advance = (): Promise<Response> => {
      if (index < this.middleware.length) {
        const current = this.middleware[index++]!;
        return current(request, advance);
      }

      return Promise.resolve(this.handler(request));
    };

    if (this.middleware.length === 0) {
      const result = this.handler(request);
      return result instanceof Promise ? result : Promise.resolve(result);
    }

    return advance();
  }
}

export function createRoutePipelineRunner(
  handler: RouteHandler,
  middleware: Middleware[],
): RoutePipelineRunner {
  return new RoutePipelineRunner(middleware, handler);
}
