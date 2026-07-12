import { describe, expect, it } from 'vitest';
import { NotFoundHttpException } from './http-exception.js';
import { normalizeRouteParams, routeParamKey } from './route-params.js';
import { signRouteUrl, verifySignedRouteUrl } from './signed-url.js';
import { Response } from './response.js';
import { Router } from './router.js';

describe('route model binding', () => {
  it('matches brace-style route parameters', async () => {
    const router = new Router();
    router.get('/posts/{id}', (request) => Response.json({ id: request.param('id') }));

    const response = await router.dispatch(new Request('http://localhost/posts/42'));
    expect(await response.json()).toEqual({ id: '42' });
  });

  it('resolves explicit bindings onto the request', async () => {
    const router = new Router();
    router.bind('post', async (value) => ({ id: Number(value), title: 'Bound' }));
    router.get('/posts/{post}', (request) =>
      Response.json(request.routeModel<{ id: number; title: string }>('post')),
    );

    const response = await router.dispatch(new Request('http://localhost/posts/7'));
    expect(await response.json()).toEqual({ id: 7, title: 'Bound' });
  });

  it('throws 404 when a required binding misses', async () => {
    const router = new Router();
    router.bind('post', async () => null);
    router.get('/posts/{post}', () => Response.text('ok'));

    await expect(
      router.dispatch(new Request('http://localhost/posts/404')),
    ).rejects.toThrow(NotFoundHttpException);
  });

  it('generates urls from bound model-like params', () => {
    const router = new Router();
    router.get('/posts/{post}', () => Response.text('ok')).name('posts.show');

    expect(
      router.url('posts.show', {
        post: {
          getAttribute(key: string) {
            return key === 'id' ? 9 : undefined;
          },
        },
      }),
    ).toBe('/posts/9');
  });
});

describe('signed urls', () => {
  it('signs and verifies route urls', () => {
    const signed = signRouteUrl('http://localhost/invites/accept', {
      secret: 'test-secret-key-1234',
      expiresAt: 4_102_444_800,
    });

    const parsed = new URL(`http://localhost${signed}`);
    expect(verifySignedRouteUrl(parsed.pathname, parsed.searchParams, 'test-secret-key-1234')).toBe(true);
  });
});

describe('route params', () => {
  it('normalizes model-like values for url generation', () => {
    expect(
      routeParamKey({
        getKey() {
          return 12;
        },
      }),
    ).toBe('12');

    expect(
      normalizeRouteParams({
        post: { getAttribute: () => 3 },
      }),
    ).toEqual({ post: '3' });
  });
});