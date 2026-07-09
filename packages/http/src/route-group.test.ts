import { describe, expect, it } from 'vitest';
import { MiddlewareRegistry } from './middleware-registry.js';
import { Response } from './response.js';
import { Router } from './router.js';
import { createThrottleMiddleware, resetThrottleStore } from './throttle.js';

describe('route groups and throttling', () => {
  it('supports Route.group({ prefix, middleware, as }, callback)', async () => {
    const router = new Router();
    const order: string[] = [];

    router.group(
      {
        prefix: 'api',
        middleware: async (_request, next) => {
          order.push('api');
          return next();
        },
        as: 'api.',
      },
      (routes) => {
        routes.get('/users', () => {
          order.push('handler');
          return Response.text('ok');
        }).name('users.index');
      },
    );

    const response = await router.dispatch(new Request('http://localhost/api/users'));
    expect(await response.text()).toBe('ok');
    expect(order).toEqual(['api', 'handler']);
    expect(router.url('api.users.index')).toBe('/api/users');
  });

  it('supports Route.middleware().group() nested inside prefix().group()', async () => {
    const router = new Router();
    const order: string[] = [];

    router.getMiddlewareRegistry().alias('auth:api', async (_request, next) => {
      order.push('auth:api');
      return next();
    });

    router.prefix('api/v1').group(() => {
      router.middleware('auth:api').group((routes) => {
        routes.get('/me', () => {
          order.push('handler');
          return Response.text('ok');
        });
      });
    });

    const response = await router.dispatch(new Request('http://localhost/api/v1/me'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
    expect(order).toEqual(['auth:api', 'handler']);
  });

  it('supports Route.middleware().get() for single routes', async () => {
    const router = new Router();
    const order: string[] = [];

    router.getMiddlewareRegistry().alias('guest', async (_request, next) => {
      order.push('guest');
      return next();
    });

    router.middleware('guest').post('/login', () => Response.text('ok'));

    const response = await router.dispatch(
      new Request('http://localhost/login', { method: 'POST' }),
    );
    expect(response.status).toBe(200);
    expect(order).toEqual(['guest']);
  });

  it('applies per-route throttle presets', async () => {
    resetThrottleStore();
    const registry = new MiddlewareRegistry();
    const router = new Router(registry);

    registry.alias(
      'throttle:strict',
      createThrottleMiddleware({
        limit: 1,
        windowMs: 60_000,
        key: () => 'strict-route',
      }),
    );

    router.get('/limited', () => Response.text('ok')).throttle('strict');

    const first = await router.dispatch(new Request('http://localhost/limited'));
    expect(first.status).toBe(200);

    const second = await router.dispatch(new Request('http://localhost/limited'));
    expect(second.status).toBe(429);
  });
});