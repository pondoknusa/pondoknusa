import { Route } from '@pondoknusa/core';
import { AuthController } from '../controllers/auth-controller.js';

export function registerRoutes(): void {
  // Nested under /api/v1 — NOT covered by default except `/api/*`
  Route.prefix('api/v1').group(() => {
    Route.middleware('guest').post('/login', [AuthController, 'login']);
  });

  // Web mutation missing csrf alias
  Route.post('/contact', [AuthController, 'contact']);
}
