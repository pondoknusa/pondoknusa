import { describe, expect, it, vi } from 'vitest';
import { PusherBroadcaster } from './pusher-broadcaster.js';

describe('PusherBroadcaster', () => {
  it('signs private channel auth payloads', () => {
    const broadcaster = new PusherBroadcaster({
      driver: 'pusher',
      key: 'app-key',
      secret: 'app-secret',
      appId: '123',
      cluster: 'mt1',
    });

    const auth = broadcaster.signChannel('1234.5678', 'private-orders.1');
    expect(auth).toMatch(/^app-key:[a-f0-9]{64}$/);
  });

  it('posts trigger payloads to the Pusher API', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const broadcaster = new PusherBroadcaster({
      driver: 'pusher',
      key: 'app-key',
      secret: 'app-secret',
      appId: '123',
      cluster: 'mt1',
    });

    await broadcaster.broadcast({
      event: 'OrderShipped',
      channels: ['orders.1'],
      data: { id: 1 },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('api-mt1.pusher.com/apps/123/events');
    expect((init as RequestInit).method).toBe('POST');
    expect(String((init as RequestInit).body)).toContain('OrderShipped');

    vi.unstubAllGlobals();
  });
});