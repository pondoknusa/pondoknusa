import { ConfigRepository } from '@tyravel/config';
import { RedisManager, type RedisConfig } from '@tyravel/redis';
import { ServiceProvider } from './service-provider.js';

export class RedisServiceProvider extends ServiceProvider {
  override register() {
    const config = this.app.make<ConfigRepository>('config');
    const redisConfig = config.get<RedisConfig>('redis');
    const manager = new RedisManager(redisConfig);

    this.app.instance('redis', manager);
    this.app.singleton(RedisManager, () => manager);
  }
}