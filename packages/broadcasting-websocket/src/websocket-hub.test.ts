import { createServer, type Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { MemoryRedis, type RedisManager } from '@tyravel/redis';
import { TYRAVEL_BROADCAST_REDIS_CHANNEL } from '@tyravel/broadcasting';
import { WebSocketHub } from './websocket-hub.js';
import {
  getWebSocketHub,
  registerWebSocketBroadcastDriver,
  resetWebSocketBroadcastDriverState,
  setWebSocketRedisManager,
  waitForWebSocketRedisSubscriber,
} from './register.js';

function asRedisManager(client: MemoryRedis): RedisManager {
  return {
    connection: async () => client as never,
    prefixKey: (key: string) => key,
    close: async () => {},
  } as unknown as RedisManager;
}

async function closeTestServer(server: Server, client?: WebSocket): Promise<void> {
  client?.close();
  server.closeAllConnections();
  await Promise.race([
    new Promise<void>((resolve) => server.close(() => resolve())),
    new Promise<void>((resolve) => setTimeout(resolve, 250)),
  ]);
}

describe('WebSocketHub', () => {
  it('dispatches events to subscribed websocket clients', async () => {
    const hub = new WebSocketHub();
    const server = createServer();
    hub.attach(server);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const client = new WebSocket(`ws://127.0.0.1:${port}/tyravel/ws`);
    const messages: string[] = [];
    await new Promise<void>((resolve, reject) => {
      client.addEventListener('open', () => resolve());
      client.addEventListener('error', () => reject(new Error('WebSocket connection failed.')));
    });
    client.addEventListener('message', (event) => {
      messages.push(String((event as MessageEvent).data));
    });

    await new Promise((resolve) => setTimeout(resolve, 25));
    client.send(JSON.stringify({ type: 'subscribe', channel: 'orders.1' }));
    await new Promise((resolve) => setTimeout(resolve, 25));

    hub.handleRedisMessage(JSON.stringify({
      event: 'OrderShipped',
      channels: ['orders.1'],
      data: { id: 42 },
    }));

    await new Promise((resolve) => setTimeout(resolve, 25));
    const eventMessage = messages
      .map((raw) => JSON.parse(raw) as { type: string; event?: string; data?: unknown })
      .find((message) => message.type === 'event' && message.event === 'OrderShipped');

    expect(eventMessage?.data).toEqual({ id: 42 });
    await closeTestServer(server, client);
  });

  it('uses the configured redis broadcast channel', async () => {
    resetWebSocketBroadcastDriverState();
    const redis = new MemoryRedis();
    setWebSocketRedisManager(asRedisManager(redis));
    registerWebSocketBroadcastDriver();

    const { BroadcastManager } = await import('@tyravel/broadcasting');
    const manager = new BroadcastManager({
      default: 'websocket',
      connections: {
        websocket: {
          driver: 'websocket',
          channel: 'custom:broadcast',
        },
      },
    });
    manager.connection('websocket');
    await waitForWebSocketRedisSubscriber();

    await manager.connection('websocket').broadcast({
      event: 'Ping',
      channels: ['health'],
      data: {},
    });

    expect(redis.published[0]?.channel).toBe('custom:broadcast');
    expect(redis.published[0]?.channel).not.toBe(TYRAVEL_BROADCAST_REDIS_CHANNEL);
    resetWebSocketBroadcastDriverState();
  });

  it('fans out redis broadcasts to connected clients', async () => {
    resetWebSocketBroadcastDriverState();
    const redis = new MemoryRedis();
    setWebSocketRedisManager(asRedisManager(redis));
    registerWebSocketBroadcastDriver();

    const { BroadcastManager } = await import('@tyravel/broadcasting');
    const manager = new BroadcastManager({
      default: 'websocket',
      connections: {
        websocket: { driver: 'websocket' },
      },
    });
    manager.connection('websocket');
    await waitForWebSocketRedisSubscriber();

    const hub = getWebSocketHub();
    expect(hub).toBeDefined();
    const delivered: Array<{ event: string; data: unknown }> = [];
    hub!.onRedisMessage((message) => {
      delivered.push({ event: message.event, data: message.data });
    });

    await manager.connection('websocket').broadcast({
      event: 'OrderShipped',
      channels: ['orders.1'],
      data: { id: 42 },
    });

    expect(delivered).toEqual([{ event: 'OrderShipped', data: { id: 42 } }]);
    resetWebSocketBroadcastDriverState();
  });
});