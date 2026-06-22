import type { Broadcaster, BroadcastPayload, SocketIoBroadcastConnectionConfig } from '@tyravel/broadcasting';
import type { RedisManager } from '@tyravel/redis';

export class SocketIoBroadcaster implements Broadcaster {
  private readonly redisConnection: string;
  private readonly channel: string;

  constructor(
    private readonly redis: RedisManager,
    config: SocketIoBroadcastConnectionConfig,
  ) {
    this.redisConnection = config.redisConnection ?? 'default';
    this.channel = config.channel ?? 'socket.io#/#';
  }

  async broadcast(payload: BroadcastPayload): Promise<void> {
    const client = await this.redis.connection(this.redisConnection);
    const packet = JSON.stringify([
      payload.event,
      payload.data,
      { rooms: payload.channels },
    ]);
    await client.publish(this.channel, packet);
  }
}