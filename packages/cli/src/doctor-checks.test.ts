import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { probeHealthReady, runDoctorChecks } from './doctor-checks.js';

describe('runDoctorChecks', () => {
  let tempDir = '';
  let previousAppKey: string | undefined;

  afterEach(() => {
    if (previousAppKey === undefined) {
      delete process.env.APP_KEY;
    } else {
      process.env.APP_KEY = previousAppKey;
    }
    previousAppKey = undefined;

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
  });

  function createProject(options: {
    appKey?: string;
    storage?: boolean;
    oauthUri?: string;
    debugConfig?: boolean;
  } = {}): string {
    tempDir = mkdtempSync(join(tmpdir(), 'pondoknusa-doctor-'));
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    mkdirSync(join(tempDir, 'config'), { recursive: true });

    if (options.storage !== false) {
      mkdirSync(join(tempDir, 'storage/framework/views'), { recursive: true });
      mkdirSync(join(tempDir, 'storage/logs'), { recursive: true });
    }

    writeFileSync(
      join(tempDir, 'pondoknusa.json'),
      JSON.stringify({ name: 'app', entry: 'src/main.ts', serve: { port: 3000, hostname: '127.0.0.1' } }),
    );
    writeFileSync(join(tempDir, 'src/main.ts'), 'export {};\n');
    writeFileSync(
      join(tempDir, 'config/app.ts'),
      `export default { name: 'app', env: 'development', debug: true };
`,
    );

    if (options.oauthUri) {
      writeFileSync(
        join(tempDir, 'config/auth.ts'),
        `export default {
  oauth: {
    providers: {
      github: { redirectUri: ${JSON.stringify(options.oauthUri)} },
    },
  },
};
`,
      );
    }

    if (options.debugConfig) {
      writeFileSync(join(tempDir, 'config/debug.ts'), 'export default { enabled: true };\n');
    }

    previousAppKey = process.env.APP_KEY;
    if (options.appKey !== undefined) {
      process.env.APP_KEY = options.appKey;
    } else {
      delete process.env.APP_KEY;
    }

    return tempDir;
  }

  it('passes node and writable storage when APP_KEY is set', async () => {
    const root = createProject({ appKey: 'pondoknusa-test-key-16' });
    const checks = await runDoctorChecks(root);

    expect(checks.find((check) => check.name === 'node')?.ok).toBe(true);
    expect(checks.find((check) => check.name === 'storage')?.ok).toBe(true);
    expect(checks.find((check) => check.name === 'app-key')?.ok).toBe(true);
  });

  it('fails when storage directories are missing', async () => {
    const root = createProject({ appKey: 'pondoknusa-test-key-16', storage: false });
    const checks = await runDoctorChecks(root);

    expect(checks.find((check) => check.name === 'storage')?.ok).toBe(false);
  });

  it('fails when APP_KEY is missing', async () => {
    const root = createProject();
    const checks = await runDoctorChecks(root);

    const appKey = checks.find((check) => check.name === 'app-key');
    expect(appKey?.ok).toBe(false);
    expect(appKey?.message).toMatch(/missing/i);
  });

  it('fails invalid OAuth redirect URIs', async () => {
    const root = createProject({
      appKey: 'pondoknusa-test-key-16',
      oauthUri: 'not-a-url',
    });
    const checks = await runDoctorChecks(root);

    const oauth = checks.find((check) => check.name === 'oauth:github');
    expect(oauth?.ok).toBe(false);
  });

  it('reports debug config when present', async () => {
    const root = createProject({
      appKey: 'pondoknusa-test-key-16',
      debugConfig: true,
    });
    const checks = await runDoctorChecks(root);

    expect(checks.find((check) => check.name === 'debug:config')?.ok).toBe(true);
  });
});

describe('probeHealthReady', () => {
  it('rejects invalid urls', async () => {
    const check = await probeHealthReady('::not-a-url::');
    expect(check.ok).toBe(false);
    expect(check.name).toBe('health:ready');
  });
});
