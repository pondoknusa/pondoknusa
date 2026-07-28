import { Route } from '@pondoknusa/core';
import { UserController } from '../controllers/user-controller.js';

export function registerWebRoutes(): void {
  Route.middleware('not-a-real-alias').get('/x', [UserController, 'index']);
  Route.middleware('throttle:burst').get('/fast', [UserController, 'index']);
  Route.middleware('auth').get('/api/profile', [UserController, 'index']);
  Route.post('/submit', [UserController, 'index']);
  Route.get('/a', [UserController, 'index']).name('dup');
  Route.get('/b', [UserController, 'index']).name('dup');
  Route.get('/same', [UserController, 'index']);
  Route.get('/same', [UserController, 'index']);
  Route.get('/broken', [UserController, 'nope']);
}
