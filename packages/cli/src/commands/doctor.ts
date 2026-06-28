import { access, constants } from 'node:fs/promises';
import { join } from 'node:path';
import { loadConfig, loadEnv } from '@tyravel/config';
import {
  Application,
  ConfigServiceProvider,
  DatabaseServiceProvider,
  setRouteApplication,
} from '@tyravel/core';
import { docsLink } from '@tyravel/support';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';

interface DoctorCheck {
  name: string;
  ok: boolean;
  message: string;
}

export class DoctorCommand extends Command {
  override readonly name = 'doctor';
  override readonly description = 'Run environment and project health checks';
  override readonly usage = 'tyravel doctor';

  async handle(): Promise<number> {
    const root = await requireProjectRoot();
    const checks: DoctorCheck[] = [];

    const nodeMajor = Number(process.versions.node.split('.')[0]);
    checks.push({
      name: 'node',
      ok: nodeMajor >= 26,
      message: nodeMajor >= 26
        ? `Node.js ${process.versions.node}`
        : `Node.js ${process.versions.node} is below 26 — see ${docsLink('/guide/deployment')}`,
    });

    for (const directory of ['storage', 'storage/framework', 'storage/framework/views', 'storage/logs']) {
      const target = join(root, directory);
      try {
        await access(target, constants.W_OK);
        checks.push({ name: directory, ok: true, message: 'Writable' });
      } catch {
        checks.push({
          name: directory,
          ok: false,
          message: `Missing or not writable — create ${directory}/`,
        });
      }
    }

    await loadEnv(root);
    let config: Record<string, unknown> = {};
    try {
      config = await loadConfig(root, { validate: false }) as Record<string, unknown>;
    } catch (error) {
      checks.push({
        name: 'config',
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const appConfig = config.app as { env?: string } | undefined;
    const environment = appConfig?.env ?? process.env.APP_ENV ?? process.env.NODE_ENV ?? 'production';
    const viewsConfig = config.views as { compiled?: boolean; compiledPath?: string } | undefined;
    const cacheDirectory = join(root, viewsConfig?.compiledPath ?? 'storage/framework/views');

    if (environment === 'production' && viewsConfig?.compiled !== false) {
      try {
        await access(cacheDirectory, constants.R_OK);
        checks.push({ name: 'view-cache', ok: true, message: `Compiled views present at ${cacheDirectory}` });
      } catch {
        checks.push({
          name: 'view-cache',
          ok: false,
          message: `Production requires compiled views — run \`tyravel view:cache\`. See ${docsLink('/guide/deployment')}`,
        });
      }
    }

    const databaseConfig = config.database as {
      default?: string;
      connections?: Record<string, { driver?: string }>;
    } | undefined;
    const defaultConnection = databaseConfig?.default;
    if (defaultConnection && defaultConnection !== 'array') {
      try {
        const app = new Application(root);
        setRouteApplication(app);
        app.register(ConfigServiceProvider);
        app.register(DatabaseServiceProvider);
        await app.boot();
        await app.make<import('@tyravel/database').DatabaseManager>('db').connection().query('SELECT 1');
        checks.push({ name: 'database', ok: true, message: `${defaultConnection} connection OK` });
      } catch (error) {
        checks.push({
          name: 'database',
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const redisConfig = config.redis as { default?: string } | undefined;
    if (redisConfig?.default) {
      try {
        const { registerNodeRedisDriver } = await import('@tyravel/redis-node');
        const { RedisServiceProvider } = await import('@tyravel/core');
        registerNodeRedisDriver();
        const app = new Application(root);
        app.register(ConfigServiceProvider);
        app.register(RedisServiceProvider);
        await app.boot();
        const redis = app.make<import('@tyravel/redis').RedisManager>('redis');
        const client = await redis.connection();
        await client.set('tyravel:doctor:probe', '1', { EX: 5 });
        checks.push({ name: 'redis', ok: true, message: 'Redis connection OK' });
      } catch (error) {
        checks.push({
          name: 'redis',
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const authConfig = config.auth as {
      oauth?: { providers?: Record<string, { redirectUri?: string }> };
    } | undefined;

    for (const [provider, providerConfig] of Object.entries(authConfig?.oauth?.providers ?? {})) {
      const redirectUri = providerConfig.redirectUri;
      if (!redirectUri) {
        continue;
      }

      let valid = false;
      try {
        const url = new URL(redirectUri);
        valid = url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        valid = false;
      }

      checks.push({
        name: `oauth:${provider}`,
        ok: valid,
        message: valid
          ? `Redirect URI ${redirectUri}`
          : `Invalid OAuth redirect URI for ${provider}`,
      });
    }

    console.log('Tyravel doctor');
    console.log('');

    let failed = 0;
    for (const check of checks) {
      const icon = check.ok ? '✓' : '✗';
      console.log(`${icon} ${check.name}: ${check.message}`);
      if (!check.ok) {
        failed += 1;
      }
    }

    console.log('');
    if (failed > 0) {
      console.log(`${failed} check(s) failed.`);
      return 1;
    }

    console.log('All checks passed.');
    return 0;
  }
}