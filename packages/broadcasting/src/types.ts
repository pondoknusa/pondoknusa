import type { Event } from '@tyravel/events';

export type BroadcastDriver = 'null' | 'log' | 'websocket';

export interface NullBroadcastConnectionConfig {
  driver: 'null';
}

export interface LogBroadcastConnectionConfig {
  driver: 'log';
}

export interface WebSocketBroadcastConnectionConfig {
  driver: 'websocket';
  redisConnection?: string;
  channel?: string;
  path?: string;
}

export type BroadcastConnectionConfig =
  | NullBroadcastConnectionConfig
  | LogBroadcastConnectionConfig
  | WebSocketBroadcastConnectionConfig;

export interface BroadcastingConfig {
  default: string;
  connections: Record<string, BroadcastConnectionConfig>;
  queueConnection?: string;
  queue?: string;
}

export interface BroadcastPayload {
  event: string;
  channels: string[];
  data: Record<string, unknown>;
  socket?: string | null;
}

export interface Broadcaster {
  broadcast(payload: BroadcastPayload): Promise<void>;
  signChannel?(socketId: string, channelName: string, channelData?: string): string;
}

export type BroadcasterFactory = (
  config: BroadcastConnectionConfig,
) => Broadcaster;

export interface ShouldBroadcast {
  readonly shouldBroadcast: true;
  broadcastOn(): string | string[];
  broadcastAs?(): string;
  broadcastWith?(): Record<string, unknown>;
  broadcastQueue?(): string;
  broadcastConnection?(): string;
}

export interface BroadcastableEvent extends Event, ShouldBroadcast {}

export type ChannelAuthorizer = (
  user: unknown,
  ...params: string[]
) => boolean | Promise<boolean>;

export interface BroadcastAuthRequest {
  socketId: string;
  channelName: string;
}

export interface BroadcastAuthResult {
  auth: string;
  channel_data?: string;
}