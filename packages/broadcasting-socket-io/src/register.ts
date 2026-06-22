import { BroadcastManager, type BroadcastConnectionConfig } from '@tyravel/broadcasting';
import type { RedisManager } from '@tyravel/redis';
import { SocketIoBroadcaster } from './socket-io-broadcaster.js';
import type { SocketIoBroadcastConnectionConfig } from '@tyravel/broadcasting';

let redisManager: RedisManager | undefined;

export function setSocketIoRedisManager(manager: RedisManager): void {
  redisManager = manager;
}

export function registerSocketIoBroadcastDriver(): void {
  BroadcastManager.extend('socketio', (config: BroadcastConnectionConfig) => {
    if (!redisManager) {
      throw new Error('Redis manager is required for the socket.io broadcast driver.');
    }
    return new SocketIoBroadcaster(redisManager, config as SocketIoBroadcastConnectionConfig);
  });
}