import { ConfigRepository } from '@tyravel/config';
import { CacheManager, CacheRepository, type CacheConfig } from '@tyravel/cache';
import { ServiceProvider } from './service-provider.js';

export class CacheServiceProvider extends ServiceProvider {
  override register() {
    const config = this.app.make<ConfigRepository>('config');
    const cacheConfig = config.get<CacheConfig>('cache');
    const manager = new CacheManager(cacheConfig);
    const repository = new CacheRepository(manager);

    this.app.instance('cache', repository);
    this.app.singleton(CacheManager, () => manager);
    this.app.singleton(CacheRepository, () => repository);
  }
}