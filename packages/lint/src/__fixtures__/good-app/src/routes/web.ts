import { Route } from '@pondoknusa/core';
import { UserController } from '../controllers/user-controller.js';

export function registerWebRoutes(): void {
  Route.get('/', async () => 'ok');

  Route.prefix('api')
    .middleware('json')
    .group(() => {
      Route.get('/users', [UserController, 'index']);
      Route.get('/users/:id', [UserController, 'show']).name('users.show');
    });
}
