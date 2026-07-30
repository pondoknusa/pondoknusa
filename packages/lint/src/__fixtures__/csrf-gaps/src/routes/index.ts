import { Route } from '@pondoknusa/core';
import { AuthController } from '../controllers/auth-controller.js';

export function registerRoutes(): void {
  // Guest mutation outside CSRF except list — still requires a token / except.
  Route.middleware('guest').post('/mobile/login', [AuthController, 'login']);

  // Web mutation missing csrf alias
  Route.post('/contact', [AuthController, 'contact']);
}
