import { Route } from '@pondoknusa/core';
import { PostController } from '../controllers/post-controller.js';

Route.prefix('api/v1').middleware('throttle:api').group(() => {
  Route.get('/posts', [PostController, 'index']);
  Route.post('/posts', [PostController, 'missingAction']);
});
