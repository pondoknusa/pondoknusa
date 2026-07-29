import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildConfigCacheManifest,
  collectConfigFingerprints,
  configBundlePath,
  configCachePath,
  fingerprintsMatch,
  readConfigCacheManifest,
  resolveConfigForBoot,
} from './config-cache.js';

describe('config cache', () => {
  let tempDir = '';

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
    delete process.env.NODE_ENV;
  });

  function scaffoldProject() {
    tempDir = mkdtempSync(join(tmpdir(), 'pondoknusa-config-cache-'));
    mkdirSync(join(tempDir, 'config'), { recursive: true });
    writeFileSync(
      join(tempDir, 'config', 'app.js'),
      'export default { name: "Pondoknusa", debug: false };',
    );
    writeFileSync(join(tempDir, '.env'), 'APP_NAME=Cached\n');
    return tempDir;
  }

  function writeCacheBundle(root: string) {
    mkdirSync(join(root, 'storage/framework'), { recursive: true });
    // Class values must survive the cache round-trip — this is what the old
    // JSON manifest could not represent.
    writeFileSync(
      configBundlePath(root),
      'class User {}\nexport default { app: { name: "Pondoknusa", debug: false }, auth: { model: User } };\n',
    );
  }

  it('collects config and .env fingerprints', async () => {
    const root = scaffoldProject();
    const fingerprints = await collectConfigFingerprints(root);

    expect(fingerprints.map((entry) => entry.name)).toEqual(['.env', 'app.js']);
  });

  it('builds and reads a config cache manifest', async () => {
    const root = scaffoldProject();
    const manifest = await buildConfigCacheManifest(root);

    mkdirSync(join(root, 'storage/framework'), { recursive: true });
    writeFileSync(configCachePath(root), `${JSON.stringify(manifest, null, 2)}\n`);

    const loaded = await readConfigCacheManifest(root);
    expect(loaded?.version).toBe(2);
    expect(loaded?.bundle).toBe('config.mjs');
    expect(loaded?.files).toHaveLength(2);
  });

  it('rejects version 1 JSON manifests', async () => {
    const root = scaffoldProject();
    mkdirSync(join(root, 'storage/framework'), { recursive: true });
    writeFileSync(
      configCachePath(root),
      JSON.stringify({ version: 1, generatedAt: '', files: [], config: {} }),
    );

    expect(await readConfigCacheManifest(root)).toBeNull();
  });

  it('loads cached config in production when fingerprints match', async () => {
    const root = scaffoldProject();
    const manifest = await buildConfigCacheManifest(root);
    writeCacheBundle(root);
    writeFileSync(configCachePath(root), `${JSON.stringify(manifest, null, 2)}\n`);

    process.env.NODE_ENV = 'production';
    const result = await resolveConfigForBoot(root);

    expect(result.loaded).toBe(true);
    expect(result.config.app).toEqual({ name: 'Pondoknusa', debug: false });
    const auth = result.config.auth as { model: new () => unknown };
    expect(typeof auth.model).toBe('function');
    expect(auth.model.name).toBe('User');
  });

  it('falls back to live config when cache is stale', async () => {
    const root = scaffoldProject();
    writeFileSync(
      join(root, 'config', 'app.js'),
      'export default { name: "Updated", debug: true };',
    );

    const staleManifest = {
      version: 2 as const,
      generatedAt: new Date().toISOString(),
      files: [{ name: 'app.js', mtimeMs: 0 }, { name: '.env', mtimeMs: 0 }],
      bundle: 'config.mjs',
    };

    mkdirSync(join(root, 'storage/framework'), { recursive: true });
    writeFileSync(configCachePath(root), `${JSON.stringify(staleManifest, null, 2)}\n`);

    process.env.NODE_ENV = 'production';
    const result = await resolveConfigForBoot(root);

    expect(result.loaded).toBe(false);
    expect(result.message).toContain('stale');
    expect(result.config.app).toEqual({ name: 'Updated', debug: true });
  });

  it('falls back to live config when the bundle is missing', async () => {
    const root = scaffoldProject();
    const manifest = await buildConfigCacheManifest(root);
    mkdirSync(join(root, 'storage/framework'), { recursive: true });
    writeFileSync(configCachePath(root), `${JSON.stringify(manifest, null, 2)}\n`);

    process.env.NODE_ENV = 'production';
    const result = await resolveConfigForBoot(root);

    expect(result.loaded).toBe(false);
    expect(result.config.app).toEqual({ name: 'Pondoknusa', debug: false });
  });

  it('matches sorted fingerprints', () => {
    expect(
      fingerprintsMatch(
        [{ name: 'app.js', mtimeMs: 1 }, { name: '.env', mtimeMs: 2 }],
        [{ name: '.env', mtimeMs: 2 }, { name: 'app.js', mtimeMs: 1 }],
      ),
    ).toBe(true);

    expect(
      fingerprintsMatch(
        [{ name: 'app.js', mtimeMs: 1 }],
        [{ name: 'app.js', mtimeMs: 2 }],
      ),
    ).toBe(false);
  });
});
