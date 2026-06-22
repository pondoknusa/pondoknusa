import { BroadcastManager } from '@tyravel/broadcasting';
import type { BroadcastConnectionConfig } from '@tyravel/broadcasting';
import { PusherBroadcaster } from './pusher-broadcaster.js';
import type { PusherBroadcastConnectionConfig } from '@tyravel/broadcasting';

export function registerPusherBroadcastDriver(): void {
  BroadcastManager.extend('pusher', (config: BroadcastConnectionConfig) => {
    return new PusherBroadcaster(config as PusherBroadcastConnectionConfig);
  });
}