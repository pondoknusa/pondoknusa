import { describe, expect, it } from 'vitest';
import { renderDebugBar } from './debug-bar.js';
import { registerDebugRoutes } from './register-routes.js';
import { DebugStore } from './store.js';
import { Router } from '@pondoknusa/http';

describe('renderDebugBar', () => {
  it('uses pondoknusa-debug-bar class names', () => {
    const html = renderDebugBar(
      {
        id: 'req-1',
        method: 'GET',
        path: '/',
        status: 200,
        durationMs: 1.5,
        timestamp: Date.now(),
        timeline: [],
        queries: [],
        warnings: [{ type: 'slow_query', message: 'slow' }],
      },
      '/__debug',
    );

    expect(html).toContain('id="pondoknusa-debug-bar"');
    expect(html).toContain('pondoknusa-debug-bar--warn');
    expect(html).not.toContain('tyr-debug-bar');
  });
});

describe('registerDebugRoutes auth guard', () => {
  it('returns 401 with watch hint when unauthenticated', async () => {
    const store = new DebugStore(10);
    const router = new Router();
    registerDebugRoutes(router, store, { path: '/__debug', requireAuth: true });

    const response = await router.dispatch(new Request('http://localhost/__debug'));

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message: string; hint?: string };
    expect(body.message).toMatch(/Unauthorized/i);
    expect(body.hint).toContain('debug:watch');
  });

  it('returns entries when authenticated', async () => {
    const store = new DebugStore(10);
    store.push({
      id: 'req-1',
      method: 'GET',
      path: '/posts',
      status: 200,
      durationMs: 4,
      timestamp: Date.now(),
      timeline: [],
      queries: [],
      warnings: [],
    });

    const router = new Router();
    router.use(async (request, next) => {
      request.user = { id: 1 };
      return next();
    });
    registerDebugRoutes(router, store, { path: '/__debug', requireAuth: true });

    const response = await router.dispatch(new Request('http://localhost/__debug'));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { entries: Array<{ id: string }> };
    expect(body.entries[0]?.id).toBe('req-1');
  });
});
