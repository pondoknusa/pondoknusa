import { Route } from '@pondoknusa/core';
import { AuthController } from '../controllers/auth-controller.js';

Route.prefix('api/v1').middleware('throttle:api').group(() => {
  Route.middleware('guest').post('/login', [AuthController, 'login']);
  Route.middleware('auth:api').get('/me', [AuthController, 'me']);
  Route.get('/auth/github/callback', [AuthController, 'callback']).name('oauth.github');
});
