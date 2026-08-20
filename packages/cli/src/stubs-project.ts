import type { NewProjectOptions } from './new-project-options.js';

const CORE_VERSION = '^4.1.1';

export function projectPackageJson(name: string, options: NewProjectOptions): string {
  const dependencies: Record<string, string> = {
    '@pondoknusa/cache': CORE_VERSION,
    '@pondoknusa/collection': CORE_VERSION,
    '@pondoknusa/config': CORE_VERSION,
    '@pondoknusa/core': CORE_VERSION,
    '@pondoknusa/database': CORE_VERSION,
    '@pondoknusa/storage': CORE_VERSION,
    '@pondoknusa/events': CORE_VERSION,
    '@pondoknusa/http': CORE_VERSION,
    '@pondoknusa/log': CORE_VERSION,
    '@pondoknusa/mail': CORE_VERSION,
    '@pondoknusa/notifications': CORE_VERSION,
    '@pondoknusa/queue': CORE_VERSION,
    '@pondoknusa/support': CORE_VERSION,
    '@pondoknusa/validation': CORE_VERSION,
    '@pondoknusa/views': CORE_VERSION,
    '@pondoknusa/echo': CORE_VERSION,
    '@pondoknusa/ssr': CORE_VERSION,
  };

  if (options.auth !== false) {
    dependencies['@pondoknusa/auth'] = CORE_VERSION;
  }

  if (options.database === 'mysql') {
    dependencies['@pondoknusa/database-mysql'] = CORE_VERSION;
  }
  if (options.database === 'postgres') {
    dependencies['@pondoknusa/database-pg'] = CORE_VERSION;
  }
  if (options.database === 'oracle') {
    dependencies['@pondoknusa/database-oracle'] = CORE_VERSION;
  }
  if (options.database === 'mssql') {
    dependencies['@pondoknusa/database-mssql'] = CORE_VERSION;
  }
  if (options.redis) {
    dependencies['@pondoknusa/redis'] = CORE_VERSION;
    dependencies['@pondoknusa/redis-node'] = CORE_VERSION;
    dependencies['@pondoknusa/broadcasting-websocket'] = CORE_VERSION;
  }

  if (options.ai) {
    dependencies['@pondoknusa/graphql'] = CORE_VERSION;
    dependencies['@pondoknusa/rag'] = CORE_VERSION;
    dependencies['@pondoknusa/vector'] = CORE_VERSION;
    if (options.database === 'postgres') {
      dependencies['@pondoknusa/vector-pg'] = CORE_VERSION;
    }
  }

  return JSON.stringify(
    {
      name,
      private: true,
      type: 'module',
      scripts: {
        dev: 'pondoknusa dev',
        start: 'pondoknusa start',
        'dev:worker': 'pondoknusa queue:work',
        test: 'pondoknusa test',
        precommit: 'pondoknusa view:lint && pondoknusa app:lint',
        'app:lint': 'pondoknusa app:lint',
        'app:lint:static': 'pondoknusa app:lint --static-only',
      },
      dependencies: {
        ...dependencies,
        '@pondoknusa/cli': CORE_VERSION,
      },
      devDependencies: {
        '@pondoknusa/testing': CORE_VERSION,
        vitest: '^3.2.4',
      },
    },
    null,
    2,
  );
}

export function mainEntry(options: NewProjectOptions): string {
  const driverImports: string[] = [];
  const driverProviders: string[] = [];

  if (options.database === 'mysql') {
    driverImports.push(
      "import { MysqlDatabaseServiceProvider } from '@pondoknusa/database-mysql';",
    );
    driverProviders.push('app.register(MysqlDatabaseServiceProvider);');
  } else if (options.database === 'postgres') {
    driverImports.push(
      "import { PgDatabaseServiceProvider } from '@pondoknusa/database-pg';",
    );
    driverProviders.push('app.register(PgDatabaseServiceProvider);');
  } else if (options.database === 'oracle') {
    driverImports.push(
      "import { OracleDatabaseServiceProvider } from '@pondoknusa/database-oracle';",
    );
    driverProviders.push('app.register(OracleDatabaseServiceProvider);');
  } else if (options.database === 'mssql') {
    driverImports.push(
      "import { MssqlDatabaseServiceProvider } from '@pondoknusa/database-mssql';",
    );
    driverProviders.push('app.register(MssqlDatabaseServiceProvider);');
  }

  if (options.redis) {
    driverImports.push("import { NodeRedisServiceProvider } from '@pondoknusa/redis-node';");
    driverProviders.push('app.register(NodeRedisServiceProvider);');
    driverImports.push(
      "import { WebSocketBroadcastServiceProvider } from '@pondoknusa/broadcasting-websocket';",
    );
    driverProviders.push('new WebSocketBroadcastServiceProvider(app).register();');
  }

  const coreImports = [
    'Application',
    'BroadcastServiceProvider',
    'CacheServiceProvider',
    'ConfigRepository',
    'ConfigServiceProvider',
    'LocaleServiceProvider',
    'LogServiceProvider',
    'DatabaseServiceProvider',
    ...(options.redis ? ['RedisServiceProvider'] : []),
    'EventServiceProvider',
    'HttpKernel',
    'MailServiceProvider',
    'NotificationServiceProvider',
    'QueueServiceProvider',
    'StorageServiceProvider',
    'prepareHttpServer',
    'setBroadcastApplication',
    'setCacheApplication',
    'setEventApplication',
    'setLangApplication',
    'setUrlApplication',
    'setLogApplication',
    'setMailApplication',
    'setNotificationApplication',
    'setQueueApplication',
    'setRouteApplication',
    'setStorageApplication',
    'setViewApplication',
    'ViewServiceProvider',
    'serve',
  ];

  const providerRegistrations = [
    'app.register(ConfigServiceProvider);',
    ...driverProviders,
    ...(options.redis ? ['app.register(RedisServiceProvider);'] : []),
    'app.register(DatabaseServiceProvider);',
    'app.register(CacheServiceProvider);',
    'app.register(StorageServiceProvider);',
    'app.register(LogServiceProvider);',
    'app.register(MailServiceProvider);',
    'app.register(NotificationServiceProvider);',
    'app.register(QueueServiceProvider);',
    'app.register(EventServiceProvider);',
    'app.register(BroadcastServiceProvider);',
    'app.register(ViewServiceProvider);',
    'app.register(LocaleServiceProvider);',
    'app.register(AppServiceProvider);',
  ];

  return `${driverImports.length > 0 ? `${driverImports.join('\n')}\n` : ''}import {
  ${coreImports.join(',\n  ')},
} from '@pondoknusa/core';
import { AppServiceProvider } from './providers/app-service-provider.js';
import './routes/channels.js';
import './routes/web.js';

const app = new Application(import.meta.dir);
setRouteApplication(app);
setLangApplication(app);
setUrlApplication(app);
setViewApplication(app);
setQueueApplication(app);
setEventApplication(app);
setBroadcastApplication(app);
setCacheApplication(app);
setStorageApplication(app);
setLogApplication(app);
setMailApplication(app);
setNotificationApplication(app);

${providerRegistrations.join('\n')}

await app.boot();

await prepareHttpServer(app, app.make(ConfigRepository));

const kernel = new HttpKernel(app);
await serve(kernel);
`;
}

export function databaseConfig(options: NewProjectOptions): string {
  if (options.database === 'mysql') {
    return `import type { MysqlConnectionConfig } from '@pondoknusa/database-mysql';
import { env, envBool, envInt, s } from '@pondoknusa/config';

export const schema = s.object({
  default: s.string({ required: true, minLength: 1 }),
  connections: s.object({
    mysql: s.object({
      driver: s.string({ enum: ['mysql'] }),
      host: s.string({ required: true, minLength: 1 }),
      database: s.string({ required: true, minLength: 1 }),
    }),
  }),
});

export default {
  default: env('DB_CONNECTION', 'mysql'),
  poolWarmup: envBool('DB_POOL_WARMUP', env('NODE_ENV', 'development') === 'production'),
  connections: {
    mysql: {
      driver: 'mysql',
      host: env('DB_HOST', '127.0.0.1'),
      port: envInt('DB_PORT', 3306),
      database: env('DB_DATABASE', 'pondoknusa'),
      username: env('DB_USERNAME', 'root'),
      password: env('DB_PASSWORD', ''),
    } satisfies MysqlConnectionConfig,
  },
} as const;
`;
  }

  if (options.database === 'postgres') {
    return `import type { PgConnectionConfig } from '@pondoknusa/database-pg';
import { env, envBool, envInt, s } from '@pondoknusa/config';

export const schema = s.object({
  default: s.string({ required: true, minLength: 1 }),
  connections: s.object({
    postgres: s.object({
      driver: s.string({ enum: ['postgres'] }),
      host: s.string({ required: true, minLength: 1 }),
      database: s.string({ required: true, minLength: 1 }),
    }),
  }),
});

export default {
  default: env('DB_CONNECTION', 'postgres'),
  poolWarmup: envBool('DB_POOL_WARMUP', env('NODE_ENV', 'development') === 'production'),
  connections: {
    postgres: {
      driver: 'postgres',
      host: env('DB_HOST', '127.0.0.1'),
      port: envInt('DB_PORT', 5432),
      database: env('DB_DATABASE', 'pondoknusa'),
      username: env('DB_USERNAME', 'postgres'),
      password: env('DB_PASSWORD', ''),
    } satisfies PgConnectionConfig,
  },
} as const;
`;
  }

  if (options.database === 'oracle') {
    return `import type { OracleConnectionConfig } from '@pondoknusa/database-oracle';
import { env, envBool, envInt, s } from '@pondoknusa/config';

export const schema = s.object({
  default: s.string({ required: true, minLength: 1 }),
  connections: s.object({
    oracle: s.object({
      driver: s.string({ enum: ['oracle'] }),
      host: s.string({ required: true, minLength: 1 }),
      database: s.string({ required: true, minLength: 1 }),
    }),
  }),
});

export default {
  default: env('DB_CONNECTION', 'oracle'),
  poolWarmup: envBool('DB_POOL_WARMUP', env('NODE_ENV', 'development') === 'production'),
  connections: {
    oracle: {
      driver: 'oracle',
      host: env('DB_HOST', '127.0.0.1'),
      port: envInt('DB_PORT', 1521),
      database: env('DB_DATABASE', 'FREEPDB1'),
      username: env('DB_USERNAME', 'system'),
      password: env('DB_PASSWORD', ''),
    } satisfies OracleConnectionConfig,
  },
} as const;
`;
  }

  if (options.database === 'mssql') {
    return `import type { MssqlConnectionConfig } from '@pondoknusa/database-mssql';
import { env, envBool, envInt, s } from '@pondoknusa/config';

export const schema = s.object({
  default: s.string({ required: true, minLength: 1 }),
  connections: s.object({
    mssql: s.object({
      driver: s.string({ enum: ['mssql'] }),
      host: s.string({ required: true, minLength: 1 }),
      database: s.string({ required: true, minLength: 1 }),
    }),
  }),
});

export default {
  default: env('DB_CONNECTION', 'mssql'),
  poolWarmup: envBool('DB_POOL_WARMUP', env('NODE_ENV', 'development') === 'production'),
  connections: {
    mssql: {
      driver: 'mssql',
      host: env('DB_HOST', '127.0.0.1'),
      port: envInt('DB_PORT', 1433),
      database: env('DB_DATABASE', 'pondoknusa'),
      username: env('DB_USERNAME', 'sa'),
      password: env('DB_PASSWORD', ''),
      encrypt: envBool('DB_ENCRYPT', true),
      trustServerCertificate: envBool('DB_TRUST_SERVER_CERTIFICATE', false),
    } satisfies MssqlConnectionConfig,
  },
} as const;
`;
  }

  return `import { env, envBool, s } from '@pondoknusa/config';

export const schema = s.object({
  default: s.string({ required: true, minLength: 1 }),
  connections: s.object({
    sqlite: s.object({
      driver: s.string({ enum: ['sqlite'] }),
      database: s.string({ required: true, minLength: 1 }),
      journalMode: s.string({
        enum: ['wal', 'delete', 'truncate', 'persist', 'memory', 'off'],
        required: false,
      }),
    }),
  }),
});

export default {
  default: env('DB_CONNECTION', 'sqlite'),
  poolWarmup: envBool('DB_POOL_WARMUP', env('NODE_ENV', 'development') === 'production'),
  connections: {
    sqlite: {
      driver: 'sqlite',
      database: env('DB_DATABASE', 'database/database.sqlite'),
      journalMode: 'wal',
    },
  },
} as const;
`;
}

export function queueConfig(options: NewProjectOptions): string {
  const redisBlock = options.redis
    ? `
    redis: {
      driver: 'redis',
      connection: 'default',
      retryAfter: 90,
    },`
    : '';

  return `import { env, s } from '@pondoknusa/config';

export const schema = s.object({
  default: s.string({ required: true, minLength: 1 }),
});

export default {
  default: env('QUEUE_CONNECTION', '${options.queue}'),
  connections: {
    database: {
      driver: 'database',
      table: 'jobs',
      connection: '${options.database}',
      retryAfter: 90,
    },${redisBlock}
  },
  failed: {
    table: 'failed_jobs',
  },
} as const;
`;
}

export function cacheConfig(options: NewProjectOptions): string {
  const redisBlock = options.redis
    ? `
    redis: {
      driver: 'redis',
      connection: 'default',
    },`
    : '';

  return `import type { CacheConfig } from '@pondoknusa/cache';
import { env } from '@pondoknusa/config';

/**
 * Production tip: set CACHE_STORE=redis when REDIS_URL is available.
 * Wrap hot read paths with Cache.remember() — see docs/guide/performance.md.
 */
export default {
  default: env('CACHE_STORE', 'file'),
  prefix: 'pondoknusa',
  connections: {
    file: {
      driver: 'file',
      path: 'storage/framework/cache',
    },
    array: { driver: 'array' },${redisBlock}
  },
} satisfies CacheConfig;
`;
}

export function envExample(name: string, options: NewProjectOptions, appKey: string): string {
  const dbLines =
    options.database === 'sqlite'
      ? `DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite`
      : `DB_CONNECTION=${options.database}
DB_HOST=127.0.0.1
DB_PORT=${
          options.database === 'postgres'
            ? '5432'
            : options.database === 'oracle'
              ? '1521'
              : options.database === 'mssql'
                ? '1433'
                : '3306'
        }
DB_DATABASE=${options.database === 'oracle' ? 'FREEPDB1' : 'pondoknusa'}
DB_USERNAME=${
          options.database === 'postgres'
            ? 'postgres'
            : options.database === 'oracle'
              ? 'system'
              : options.database === 'mssql'
                ? 'sa'
                : 'root'
        }
DB_PASSWORD=`;

  const redisLines = options.redis
    ? `
REDIS_URL=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0`
    : '';

  const cacheDefault = options.redis ? 'file' : 'file';

  return `# ${name} environment variables
APP_NAME=${name}
APP_KEY=${appKey}
APP_DEBUG=true
APP_URL=http://127.0.0.1:3000
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en

${dbLines}
DB_POOL_WARMUP=true

CACHE_STORE=${cacheDefault}
QUEUE_CONNECTION=${options.queue}${redisLines}

MAIL_MAILER=log
MAIL_FROM_ADDRESS=hello@example.com
MAIL_FROM_NAME=Pondoknusa
# MAIL_HOST=127.0.0.1
# MAIL_PORT=587
# MAIL_USERNAME=
# MAIL_PASSWORD=
# MAIL_ENCRYPTION=tls

BROADCAST_CONNECTION=${options.redis ? 'websocket' : 'log'}
# BROADCAST_REDIS_CHANNEL=pondoknusa:broadcast

# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
# GITHUB_REDIRECT_URI=http://127.0.0.1:3000/auth/github/callback
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GOOGLE_REDIRECT_URI=http://127.0.0.1:3000/auth/google/callback
`;
}