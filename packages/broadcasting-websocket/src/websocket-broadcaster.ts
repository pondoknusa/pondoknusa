import {
  TYRAVEL_BROADCAST_REDIS_CHANNEL,
  buildChannelAuthToken,
  type Broadcaster,
  type BroadcastPayload,
  type WebSocketBroadcastConnectionConfig,
} from '@tyravel/broadcasting';
import type { RedisManager } from '@tyravel/redis';

export class WebSocketBroadcaster implements Broadcaster {
  private readonly redisConnection: string;
  private readonly channel: string;

  constructor(
    private readonly redis: RedisManager,
    config: WebSocketBroadcastConnectionConfig,
  ) {
    this.redisConnection = config.redisConnection ?? 'default';
    this.channel = config.channel ?? TYRAVEL_BROADCAST_REDIS_CHANNEL;
  }

  async broadcast(payload: BroadcastPayload): Promise<void> {
    const client = await this.redis.connection(this.redisConnection);
    const message = JSON.stringify({
      event: payload.event,
      channels: payload.channels,
      data: payload.data,
      socket: payload.socket ?? null,
    });
    await client.publish(this.channel, message);
  }

  signChannel(socketId: string, channelName: string, channelData?: string): string {
    return buildChannelAuthToken(socketId, channelName, channelData);
  }
}