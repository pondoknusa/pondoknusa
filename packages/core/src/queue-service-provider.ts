import { ConfigRepository } from '@tyravel/config';
import { DatabaseManager } from '@tyravel/database';
import {
  Dispatcher,
  JobRegistry,
  QueueManager,
  QueueProcessor,
  QueueWorker,
  type QueueConfig,
} from '@tyravel/queue';
import { ServiceProvider } from './service-provider.js';

export class QueueServiceProvider extends ServiceProvider {
  override register() {
    const config = this.app.make<ConfigRepository>('config');
    const queueConfig = config.get<QueueConfig>('queue');
    const registry = new JobRegistry();

    this.app.instance('jobs.registry', registry);
    this.app.singleton(JobRegistry, () => registry);

    const database = this.resolveDatabaseManager();

    const worker = new QueueWorker(registry, this.app);
    const manager = new QueueManager(queueConfig, worker, database);
    const dispatcher = new Dispatcher(manager.connection());
    const processor = new QueueProcessor(manager, registry, worker);

    this.app.instance('queue', manager);
    this.app.singleton(QueueManager, () => manager);
    this.app.instance('queue.dispatcher', dispatcher);
    this.app.singleton(Dispatcher, () => dispatcher);
    this.app.instance('queue.processor', processor);
    this.app.singleton(QueueProcessor, () => processor);
  }

  private resolveDatabaseManager(): DatabaseManager | undefined {
    try {
      return this.app.make<DatabaseManager>('db');
    } catch {
      return undefined;
    }
  }
}