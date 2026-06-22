import { registerPusherBroadcastDriver } from './register.js';

export class PusherBroadcastServiceProvider {
  constructor(_app: unknown) {}

  register(): void {
    registerPusherBroadcastDriver();
  }
}