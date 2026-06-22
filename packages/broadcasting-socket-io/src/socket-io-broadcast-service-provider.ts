import type { RedisManager } from '@tyravel/redis';
import { registerSocketIoBroadcastDriver, setSocketIoRedisManager } from './register.js';

export class SocketIoBroadcastServiceProvider {
  constructor(private readonly app: { make<T>(key: string): T }) {}

  register(): void {
    try {
      const redis = this.app.make<RedisManager>('redis');
      setSocketIoRedisManager(redis);
    } catch {
      // Redis provider not registered.
    }
    registerSocketIoBroadcastDriver();
  }
}