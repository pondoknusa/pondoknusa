import { describe, expect, it } from 'vitest';
import { TyravelRequest } from './request.js';
import { createResponseCacheMiddleware } from './response-cache.js';
import { Response } from './response.js';

class MemoryResponseCache {
  private readonly entries = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.entries.get(key) as T | undefined) ?? null;
  }

  async put(key: string, value: unknown): Promise<void> {
    this.entries.set(key, value);
  }
}

describe('createResponseCacheMiddleware', () => {
  it('serves cached GET responses for anonymous requests', async () => {
    const cache = new MemoryResponseCache();
    const middleware = createResponseCacheMiddleware({ cache, ttlSeconds: 120 });
    let hits = 0;

    const handler = async () => {
      hits += 1;
      return Response.json({ count: hits });
    };

    const firstRequest = new TyravelRequest(new Request('http://localhost/posts'));
    const firstResponse = await middleware(firstRequest, handler);
    expect(firstResponse.headers.get('x-tyravel-cache')).toBe('MISS');
    expect(await firstResponse.json()).toEqual({ count: 1 });

    const secondRequest = new TyravelRequest(new Request('http://localhost/posts'));
    const secondResponse = await middleware(secondRequest, handler);
    expect(secondResponse.headers.get('x-tyravel-cache')).toBe('HIT');
    expect(await secondResponse.json()).toEqual({ count: 1 });
    expect(hits).toBe(1);
  });

  it('skips cache for authenticated requests by default', async () => {
    const cache = new MemoryResponseCache();
    const middleware = createResponseCacheMiddleware({ cache });
    let hits = 0;

    const handler = async () => {
      hits += 1;
      return Response.text('ok');
    };

    const request = new TyravelRequest(new Request('http://localhost/dashboard'));
    request.user = { id: 1 };

    await middleware(request, handler);
    await middleware(request, handler);

    expect(hits).toBe(2);
  });

  it('does not cache non-GET methods', async () => {
    const cache = new MemoryResponseCache();
    const middleware = createResponseCacheMiddleware({ cache });
    let hits = 0;

    const request = new TyravelRequest(
      new Request('http://localhost/posts', { method: 'POST' }),
    );

    await middleware(request, async () => {
      hits += 1;
      return Response.json({ ok: true });
    });
    await middleware(request, async () => {
      hits += 1;
      return Response.json({ ok: true });
    });

    expect(hits).toBe(2);
  });

  it('does not cache error responses', async () => {
    const cache = new MemoryResponseCache();
    const middleware = createResponseCacheMiddleware({ cache });
    let hits = 0;

    const request = new TyravelRequest(new Request('http://localhost/missing'));
    const handler = async () => {
      hits += 1;
      return Response.json({ error: 'not found' }, { status: 404 });
    };

    await middleware(request, handler);
    await middleware(request, handler);

    expect(hits).toBe(2);
  });
});