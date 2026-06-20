import { describe, expect, it } from 'vitest';
import { Response } from '@tyravel/http';
import type { TyravelRequest } from '@tyravel/http';
import { Application } from './application.js';
import { createControllerHandler } from './controller.js';
import { HttpKernel } from './http-kernel.js';
import { Route, setRouteApplication } from './route.js';

class UserController {
  index() {
    return Response.json({ users: [] });
  }

  show(request: TyravelRequest) {
    return Response.json({ id: request.param('id') });
  }
}

describe('Controller resolution', () => {
  it('dispatches controller actions through the container', async () => {
    const app = new Application();
    setRouteApplication(app);

    Route.get('/users', [UserController, 'index']);
    Route.get('/users/:id', [UserController, 'show']);

    const kernel = new HttpKernel(app);
    const indexResponse = await kernel.handle(new Request('http://localhost/users'));
    const showResponse = await kernel.handle(
      new Request('http://localhost/users/7'),
    );

    expect(await indexResponse.json()).toEqual({ users: [] });
    expect(await showResponse.json()).toEqual({ id: '7' });
  });

  it('creates a route handler from a controller tuple', async () => {
    const app = new Application();
    const handler = createControllerHandler(app, [UserController, 'index']);
    const response = await handler(new Request('http://localhost') as never);

    expect(await response.json()).toEqual({ users: [] });
  });
});