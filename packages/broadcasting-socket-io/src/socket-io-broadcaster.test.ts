import { describe, expect, it } from 'vitest';
import { MemoryRedis, type RedisManager } from '@tyravel/redis';
import { SocketIoBroadcaster } from './socket-io-broadcaster.js';

function asRedisManager(client: MemoryRedis): RedisManager {
  return {
    connection: async () => client as never,
    prefixKey: (key: string) => key,
    close: async () => {},
  } as unknown as RedisManager;
}

describe('SocketIoBroadcaster', () => {
  it('publishes socket.io packets to redis', async () => {
    const redis = new MemoryRedis();
    const broadcaster = new SocketIoBroadcaster(asRedisManager(redis), {
      driver: 'socketio',
      channel: 'socket.io#/#',
    });

    await broadcaster.broadcast({
      event: 'OrderShipped',
      channels: ['orders.1'],
      data: { id: 1 },
    });

    expect(redis.published).toHaveLength(1);
    expect(redis.published[0]?.channel).toBe('socket.io#/#');
    expect(redis.published[0]?.message).toContain('OrderShipped');
  });
});