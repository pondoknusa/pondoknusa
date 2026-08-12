import { access, constants } from 'node:fs/promises';
import { join } from 'node:path';
import { loadConfig, loadEnv } from '@pondoknusa/config';
import {
  Application,
  ConfigServiceProvider,
  DatabaseServiceProvider,
  QueueServiceProvider,
  setRouteApplication,
} from '@pondoknusa/core';
import { Migrator } from '@pondoknusa/database';
import { docsLink } from '@pondoknusa/support';
import { isHeadlessProject } from './headless-project.js';
import { pathExists } from './utils.js';

export interface DoctorCheck {
  name: string;
  ok: boolean;
  message: string;
}

const APP_KEY_MIN_LENGTH = 16;

export async function runDoctorChecks(root: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const headless = await isHeadlessProject(root);

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  checks.push({
    name: 'node',
    ok: nodeMajor >= 26,
    message: nodeMajor >= 26
      ? `Node.js ${process.versions.node}`
      : `Node.js ${process.versions.node} is below 26 — see ${docsLink('/guide/deployment')}`,
  });

  const storageDirectories = headless
    ? ['storage', 'storage/framework', 'storage/logs']
    : ['storage', 'storage/framework', 'storage/framework/views', 'storage/logs'];

  for (const directory of storageDirectories) {
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
    config = (await loadConfig(root, { validate: false })) as Record<string, unknown>;
  } catch (error) {
    checks.push({
      name: 'config',
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const appConfig = config.app as { env?: string; key?: string; debug?: boolean } | undefined;
  const environment = appConfig?.env ?? process.env.APP_ENV ?? process.env.NODE_ENV ?? 'production';
  const viewsConfig = config.views as { compiled?: boolean; compiledPath?: string } | undefined;
  const cacheDirectory = join(root, viewsConfig?.compiledPath ?? 'storage/framework/views');

  const appKey = resolveAppKey(appConfig?.key);
  if (appKey.length === 0) {
    checks.push({
      name: 'app-key',
      ok: false,
      message: `APP_KEY is missing — set a key of at least ${APP_KEY_MIN_LENGTH} characters. See ${docsLink('/guide/upgrading-to-3.0')}`,
    });
  } else if (appKey.length < APP_KEY_MIN_LENGTH) {
    checks.push({
      name: 'app-key',
      ok: false,
      message: `APP_KEY is too short (${appKey.length} chars) — use at least ${APP_KEY_MIN_LENGTH}. See ${docsLink('/guide/upgrading-to-3.0')}`,
    });
  } else {
    checks.push({
      name: 'app-key',
      ok: true,
      message: `APP_KEY set (${appKey.length} characters)`,
    });
  }

  if (headless) {
    checks.push({
      name: 'mode',
      ok: true,
      message: `Headless API — see ${docsLink('/guide/headless')}`,
    });
  }

  if (!headless && environment === 'production' && viewsConfig?.compiled !== false) {
    try {
      await access(cacheDirectory, constants.R_OK);
      checks.push({ name: 'view-cache', ok: true, message: `Compiled views present at ${cacheDirectory}` });
    } catch {
      checks.push({
        name: 'view-cache',
        ok: false,
        message: `Production requires compiled views — run \`pondoknusa view:cache\`. See ${docsLink('/guide/deployment')}`,
      });
    }
  }

  if (await pathExists(join(root, 'config/debug.ts'))) {
    checks.push({
      name: 'debug:config',
      ok: true,
      message: 'config/debug.ts present — use debug:watch or an authenticated session for /__debug',
    });
  }

  const databaseConfig = config.database as {
    default?: string;
    connections?: Record<string, { driver?: string }>;
  } | undefined;
  const defaultConnection = databaseConfig?.default;
  if (defaultConnection && defaultConnection !== 'array') {
    await runDatabaseAndMigrationChecks(root, defaultConnection, checks);
  }

  const redisConfig = config.redis as { default?: string } | undefined;
  if (redisConfig?.default) {
    await runRedisCheck(root, checks);
  }

  const queueConfig = config.queue as {
    default?: string;
    connections?: Record<string, { driver?: string }>;
  } | undefined;
  const queueDefault = queueConfig?.default;
  const queueDriver = queueDefault ? queueConfig?.connections?.[queueDefault]?.driver : undefined;
  if (queueDefault && queueDriver && queueDriver !== 'sync' && queueDriver !== 'array') {
    await runQueueCheck(root, queueDefault, queueDriver, Boolean(redisConfig?.default), checks);
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

  return checks;
}

export async function probeHealthReady(baseUrl: string): Promise<DoctorCheck> {
  let target: URL;
  try {
    const trimmed = baseUrl.replace(/\/$/, '');
    target = /\/health(\/|$)/.test(trimmed)
      ? new URL(trimmed)
      : new URL(`${trimmed}/health/ready`);
  } catch {
    return {
      name: 'health:ready',
      ok: false,
      message: `Invalid --url value: ${baseUrl}`,
    };
  }

  try {
    const response = await fetch(target);
    if (!response.ok) {
      return {
        name: 'health:ready',
        ok: false,
        message: `${target.href} returned ${response.status}`,
      };
    }

    return {
      name: 'health:ready',
      ok: true,
      message: `${target.href} OK`,
    };
  } catch (error) {
    return {
      name: 'health:ready',
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function resolveAppKey(configKey: string | undefined): string {
  if (typeof configKey === 'string' && configKey.trim().length > 0) {
    return configKey.trim();
  }
  const envKey = process.env.APP_KEY;
  if (typeof envKey === 'string') {
    return envKey.trim();
  }
  return '';
}

async function runDatabaseAndMigrationChecks(
  root: string,
  defaultConnection: string,
  checks: DoctorCheck[],
): Promise<void> {
  const app = new Application(root);
  try {
    setRouteApplication(app);
    app.register(ConfigServiceProvider);
    app.register(DatabaseServiceProvider);
    await app.boot();
    const db = app.make<import('@pondoknusa/database').DatabaseManager>('db');
    await db.connection().query('SELECT 1');
    checks.push({ name: 'database', ok: true, message: `${defaultConnection} connection OK` });

    try {
      const migrator = new Migrator(db.connection(), app.migrationPaths());
      const pending = await migrator.pending();
      if (pending.length > 0) {
        checks.push({
          name: 'migrations',
          ok: false,
          message: `${pending.length} pending migration(s) — run \`pondoknusa migrate\`. See ${docsLink('/guide/deployment')}`,
        });
      } else {
        checks.push({ name: 'migrations', ok: true, message: 'No pending migrations' });
      }
    } catch (error) {
      checks.push({
        name: 'migrations',
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    await db.close();
  } catch (error) {
    checks.push({
      name: 'database',
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function runRedisCheck(root: string, checks: DoctorCheck[]): Promise<void> {
  const app = new Application(root);
  try {
    const { registerNodeRedisDriver } = await import('@pondoknusa/redis-node');
    const { RedisServiceProvider } = await import('@pondoknusa/core');
    registerNodeRedisDriver();
    app.register(ConfigServiceProvider);
    app.register(RedisServiceProvider);
    await app.boot();
    const redis = app.make<import('@pondoknusa/redis').RedisManager>('redis');
    const client = await redis.connection();
    await client.set('pondoknusa:doctor:probe', '1', { EX: 5 });
    checks.push({ name: 'redis', ok: true, message: 'Redis connection OK' });
    await redis.close();
  } catch (error) {
    checks.push({
      name: 'redis',
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function runQueueCheck(
  root: string,
  queueDefault: string,
  queueDriver: string,
  redisConfigured: boolean,
  checks: DoctorCheck[],
): Promise<void> {
  const app = new Application(root);
  try {
    app.register(ConfigServiceProvider);
    if (queueDriver === 'database') {
      app.register(DatabaseServiceProvider);
    }
    if (queueDriver === 'redis' || redisConfigured) {
      const { registerNodeRedisDriver } = await import('@pondoknusa/redis-node');
      const { RedisServiceProvider } = await import('@pondoknusa/core');
      registerNodeRedisDriver();
      app.register(RedisServiceProvider);
    }
    app.register(QueueServiceProvider);
    await app.boot();
    const queue = app.make<import('@pondoknusa/queue').QueueManager>('queue');
    queue.connection(queueDefault);
    checks.push({
      name: 'queue',
      ok: true,
      message: `${queueDefault} (${queueDriver}) connection OK`,
    });

    try {
      const db = app.make<import('@pondoknusa/database').DatabaseManager>('db');
      await db.close();
    } catch {
      // Database may not be registered for redis-only queue.
    }
    try {
      const redis = app.make<import('@pondoknusa/redis').RedisManager>('redis');
      await redis.close();
    } catch {
      // Redis may not be registered for database-only queue.
    }
  } catch (error) {
    checks.push({
      name: 'queue',
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
