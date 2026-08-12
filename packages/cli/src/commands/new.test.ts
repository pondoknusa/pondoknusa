import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { NewCommand } from './new.js';

describe('NewCommand', () => {
  let tempDir = '';

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
  });

  it('scaffolds a Pondoknusa application', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'pondoknusa-new-'));
    const command = new NewCommand();

    const code = await command.handle([
      'my-app',
      `--path=${tempDir}`,
      '--db=sqlite',
      '--no-redis',
      '--no-install',
      '--no-git',
    ]);
    const projectDir = join(tempDir, 'my-app');

    expect(code).toBe(0);
    expect(existsSync(join(projectDir, 'package.json'))).toBe(true);
    expect(existsSync(join(projectDir, '.env'))).toBe(true);
    expect(existsSync(join(projectDir, '.env.example'))).toBe(true);
    expect(existsSync(join(projectDir, 'pondoknusa.json'))).toBe(true);
    expect(existsSync(join(projectDir, 'config/app.ts'))).toBe(true);
    expect(existsSync(join(projectDir, 'src/main.ts'))).toBe(true);
    expect(existsSync(join(projectDir, 'src/routes/web.ts'))).toBe(true);
    expect(
      existsSync(join(projectDir, 'src/providers/app-service-provider.ts')),
    ).toBe(true);
    expect(existsSync(join(projectDir, 'config/redis.ts'))).toBe(false);

    const env = readFileSync(join(projectDir, '.env'), 'utf8');
    expect(env).toMatch(/^APP_KEY=.+/m);
    expect(env).toContain('QUEUE_CONNECTION=database');
    expect(readFileSync(join(projectDir, 'config/app.ts'), 'utf8')).toContain("env('APP_KEY'");

    expect(existsSync(join(projectDir, 'storage/logs/.gitkeep'))).toBe(true);
    expect(existsSync(join(projectDir, 'storage/framework/views/.gitkeep'))).toBe(true);
    expect(existsSync(join(projectDir, '.gitignore'))).toBe(true);
    expect(existsSync(join(projectDir, 'config/auth.ts'))).toBe(true);
    expect(existsSync(join(projectDir, 'src/models/User.ts'))).toBe(true);
    expect(existsSync(join(projectDir, '.cursor/mcp.json'))).toBe(true);
    expect(existsSync(join(projectDir, '.cursor/rules/pondoknusa.mdc'))).toBe(true);
    expect(existsSync(join(projectDir, 'AGENTS.md'))).toBe(true);
    expect(readFileSync(join(projectDir, 'AGENTS.md'), 'utf8')).toContain('How Pondoknusa works');

    const queueConfig = readFileSync(join(projectDir, 'config/queue.ts'), 'utf8');
    expect(queueConfig).not.toContain("driver: 'sync'");
    expect(queueConfig).toContain("env('QUEUE_CONNECTION', 'database')");

    expect(existsSync(join(projectDir, 'src/routes/channels.ts'))).toBe(true);
    expect(readFileSync(join(projectDir, 'src/routes/channels.ts'), 'utf8')).toContain(
      'private-orders.{orderId}',
    );
    expect(readFileSync(join(projectDir, 'src/routes/channels.ts'), 'utf8')).toContain(
      'echo.private',
    );
    expect(existsSync(join(projectDir, 'resources/client/echo.ts'))).toBe(true);
    expect(readFileSync(join(projectDir, 'config/broadcasting.ts'), 'utf8')).toContain(
      "env('BROADCAST_CONNECTION', 'log')",
    );
    expect(readFileSync(join(projectDir, 'resources/views/layouts/app.tyr'), 'utf8')).toContain(
      '@echo',
    );
    expect(readFileSync(join(projectDir, 'src/main.ts'), 'utf8')).toContain(
      './routes/channels.js',
    );
    expect(readFileSync(join(projectDir, 'package.json'), 'utf8')).toContain('@pondoknusa/echo');
    expect(readFileSync(join(projectDir, 'package.json'), 'utf8')).toContain('"dev": "pondoknusa dev"');
    expect(readFileSync(join(projectDir, 'package.json'), 'utf8')).toContain('"start": "pondoknusa start"');
    expect(readFileSync(join(projectDir, 'package.json'), 'utf8')).toContain('"@pondoknusa/cli"');
    expect(readFileSync(join(projectDir, 'package.json'), 'utf8')).toContain('@pondoknusa/mcp');

    expect(existsSync(join(projectDir, 'deploy/cloudflare.md'))).toBe(true);
    expect(existsSync(join(projectDir, 'deploy/Dockerfile'))).toBe(true);
    expect(existsSync(join(projectDir, 'deploy/docker-entrypoint.sh'))).toBe(true);
    expect(readFileSync(join(projectDir, 'deploy/docker-entrypoint.sh'), 'utf8')).toContain('pondoknusa start');
    expect(readFileSync(join(projectDir, 'config/health.ts'), 'utf8')).toContain('/health/live');
  });

  it('scaffolds a headless API application', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'pondoknusa-new-'));
    const command = new NewCommand();

    const code = await command.handle([
      'headless-api',
      `--path=${tempDir}`,
      '--headless',
      '--db=sqlite',
      '--no-redis',
      '--no-auth',
      '--no-install',
      '--no-git',
      '--no-mcp',
    ]);
    const projectDir = join(tempDir, 'headless-api');
    const pkg = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    const pondoknusaJson = JSON.parse(readFileSync(join(projectDir, 'pondoknusa.json'), 'utf8')) as {
      mode?: string;
    };

    expect(code).toBe(0);
    expect(pondoknusaJson.mode).toBe('headless');
    expect(existsSync(join(projectDir, 'src/routes/api.ts'))).toBe(true);
    expect(existsSync(join(projectDir, 'src/routes/web.ts'))).toBe(false);
    expect(existsSync(join(projectDir, 'config/views.ts'))).toBe(false);
    expect(existsSync(join(projectDir, 'resources/views/layouts/app.tyr'))).toBe(false);
    expect(existsSync(join(projectDir, 'src/routes/channels.ts'))).toBe(false);
    expect(existsSync(join(projectDir, 'resources/client/echo.ts'))).toBe(false);
    expect(existsSync(join(projectDir, '.github/workflows/view-types.yml'))).toBe(false);
    expect(existsSync(join(projectDir, 'storage/framework/views'))).toBe(false);
    expect(existsSync(join(projectDir, 'storage/logs/.gitkeep'))).toBe(true);
    expect(existsSync(join(projectDir, '.cursor/mcp.json'))).toBe(false);
    expect(pkg.dependencies['@pondoknusa/echo']).toBeUndefined();
    expect(readFileSync(join(projectDir, 'config/app.ts'), 'utf8')).toContain('headless: true');
    expect(readFileSync(join(projectDir, 'src/main.ts'), 'utf8')).toContain('./routes/api.js');
    expect(readFileSync(join(projectDir, 'src/main.ts'), 'utf8')).not.toContain('ViewServiceProvider');
    expect(readFileSync(join(projectDir, 'src/main.ts'), 'utf8')).toContain('prepareHttpServer');
    expect(readFileSync(join(projectDir, 'src/routes/api.ts'), 'utf8')).toContain("Route.prefix('api/v1')");
    expect(readFileSync(join(projectDir, 'README.md'), 'utf8')).toContain('Headless Pondoknusa API');
  });

  it('scaffolds mysql and redis driver packages when requested', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'pondoknusa-new-'));
    const command = new NewCommand();

    const code = await command.handle([
      'driver-app',
      `--path=${tempDir}`,
      '--db=mysql',
      '--redis',
      '--no-install',
      '--no-git',
      '--no-mcp',
      '--no-auth',
    ]);
    const projectDir = join(tempDir, 'driver-app');
    const pkg = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };

    expect(code).toBe(0);
    expect(pkg.dependencies['@pondoknusa/database-mysql']).toBeDefined();
    expect(pkg.dependencies['@pondoknusa/redis']).toBeDefined();
    expect(pkg.dependencies['@pondoknusa/redis-node']).toBeDefined();
    expect(existsSync(join(projectDir, 'config/redis.ts'))).toBe(true);
    expect(readFileSync(join(projectDir, 'src/main.ts'), 'utf8')).toContain(
      'MysqlDatabaseServiceProvider',
    );
    expect(readFileSync(join(projectDir, 'src/main.ts'), 'utf8')).toContain(
      'NodeRedisServiceProvider',
    );
    expect(pkg.dependencies['@pondoknusa/broadcasting-websocket']).toBeDefined();
    expect(readFileSync(join(projectDir, 'config/broadcasting.ts'), 'utf8')).toContain(
      "env('BROADCAST_CONNECTION', 'websocket')",
    );
    expect(readFileSync(join(projectDir, 'resources/client/echo.ts'), 'utf8')).not.toContain(
      'socket.io-client',
    );
    expect(readFileSync(join(projectDir, 'src/main.ts'), 'utf8')).toContain(
      'WebSocketBroadcastServiceProvider',
    );
  });

  it('scaffolds oracle and mssql driver packages when requested', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'pondoknusa-new-'));
    const command = new NewCommand();

    const oracleCode = await command.handle([
      'oracle-app',
      `--path=${tempDir}`,
      '--db=oracle',
      '--no-redis',
      '--no-auth',
      '--no-install',
      '--no-git',
      '--no-mcp',
    ]);
    const oracleDir = join(tempDir, 'oracle-app');
    const oraclePkg = JSON.parse(readFileSync(join(oracleDir, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };

    expect(oracleCode).toBe(0);
    expect(oraclePkg.dependencies['@pondoknusa/database-oracle']).toBeDefined();
    expect(readFileSync(join(oracleDir, 'src/main.ts'), 'utf8')).toContain(
      'OracleDatabaseServiceProvider',
    );
    expect(readFileSync(join(oracleDir, 'config/database.ts'), 'utf8')).toContain(
      "driver: 'oracle'",
    );

    const mssqlCode = await command.handle([
      'mssql-app',
      `--path=${tempDir}`,
      '--db=mssql',
      '--no-redis',
      '--no-auth',
      '--no-install',
      '--no-git',
      '--no-mcp',
    ]);
    const mssqlDir = join(tempDir, 'mssql-app');
    const mssqlPkg = JSON.parse(readFileSync(join(mssqlDir, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };

    expect(mssqlCode).toBe(0);
    expect(mssqlPkg.dependencies['@pondoknusa/database-mssql']).toBeDefined();
    expect(readFileSync(join(mssqlDir, 'src/main.ts'), 'utf8')).toContain(
      'MssqlDatabaseServiceProvider',
    );
    expect(readFileSync(join(mssqlDir, 'config/database.ts'), 'utf8')).toContain(
      "driver: 'mssql'",
    );
  });
});
