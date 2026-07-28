import { Route } from '@pondoknusa/core';
import { AuthController } from '../controllers/auth-controller.js';

export function registerAuthRoutes(): void {
  Route.middleware(['csrf', 'guest']).post('/register', [AuthController, 'register']);
  Route.middleware(['csrf', 'guest']).post('/login', [AuthController, 'login']);
  Route.middleware(['csrf', 'auth']).post('/logout', [AuthController, 'logout']);
  Route.middleware('auth').get('/me', [AuthController, 'me']);
}
