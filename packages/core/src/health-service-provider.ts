import { ConfigRepository } from '@tyravel/config';
import { DatabaseManager } from '@tyravel/database';
import { Response } from '@tyravel/http';
import { RedisManager } from '@tyravel/redis';
import { HealthChecker } from './health.js';
import { Route } from './route.js';
import { ServiceProvider } from './service-provider.js';

export interface HealthConfig {
  enabled?: boolean;
  path?: string;
  checks?: {
    database?: boolean;
    redis?: boolean;
  };
}

export class HealthServiceProvider extends ServiceProvider {
  override async register() {
    const checker = new HealthChecker();
    checker.register('app', () => true);
    this.app.instance('health', checker);
    this.app.singleton(HealthChecker, () => checker);
  }

  override async boot() {
    const config = this.app.make<ConfigRepository>('config');
    let healthConfig: HealthConfig | undefined;

    try {
      healthConfig = config.get<HealthConfig>('health');
    } catch {
      return;
    }

    if (healthConfig?.enabled === false) {
      return;
    }

    const checker = this.app.make<HealthChecker>('health');

    if (healthConfig?.checks?.database !== false) {
      checker.register('database', async () => {
        const db = this.app.make<DatabaseManager>('db');
        await db.connection().query('SELECT 1');
        return true;
      });
    }

    if (healthConfig?.checks?.redis) {
      checker.register('redis', async () => {
        const redis = this.app.make<RedisManager>('redis');
        const client = await redis.connection();
        await client.set('tyravel:health:probe', '1', { EX: 5 });
        return true;
      });
    }

    const path = healthConfig?.path ?? '/health';
    Route.get(path, async () => {
      const report = await checker.run();
      return Response.json(report, { status: report.status === 'ok' ? 200 : 503 });
    });
  }
}