import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  buildConfigCacheManifest,
  configBundlePath,
  configCachePath,
  loadEnv,
} from '@pondoknusa/config';
import { CONFIG_FILE_PATTERN, generateConfigBundleEntry } from '../config-entry.js';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { parseOptions, positionalArgs } from '../utils.js';

export class ConfigCacheCommand extends Command {
  override readonly name = 'config:cache';
  override readonly description = 'Bundle merged config into a single module for production boot';
  override readonly usage = 'pondoknusa config:cache';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    positionalArgs(args);

    const root = await requireProjectRoot();
    await loadEnv(root);

    const configDir = join(root, 'config');
    const files = (await readdir(configDir))
      .filter((name) => CONFIG_FILE_PATTERN.test(name))
      .sort();

    if (files.length === 0) {
      console.error(`No config files found in ${configDir}`);
      return 1;
    }

    let esbuild: {
      build: (options: Record<string, unknown>) => Promise<{ errors: unknown[] }>;
    };
    try {
      esbuild = (await import('esbuild')) as typeof esbuild;
    } catch {
      console.error(
        'esbuild is required for pondoknusa config:cache. Install it in your app: npm install -D esbuild',
      );
      return 1;
    }

    const targetDir = join(root, 'storage', 'framework');
    await mkdir(targetDir, { recursive: true });

    const result = await esbuild.build({
      stdin: {
        contents: generateConfigBundleEntry(files),
        resolveDir: configDir,
        loader: 'ts',
      },
      outfile: configBundlePath(root),
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node26',
      packages: 'external',
      keepNames: true,
      logLevel: 'warning',
    });

    if (result.errors.length > 0) {
      console.error('Config bundle failed.');
      return 1;
    }

    const manifest = await buildConfigCacheManifest(root);
    await writeFile(
      configCachePath(root),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );

    console.log(
      `Cached config from ${files.length} source file(s) to storage/framework/config.mjs`,
    );
    return 0;
  }
}

export class ConfigClearCommand extends Command {
  override readonly name = 'config:clear';
  override readonly description = 'Remove the cached config manifest and bundle';
  override readonly usage = 'pondoknusa config:clear';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    positionalArgs(args);

    const root = await requireProjectRoot();
    let cleared = false;

    for (const target of [configCachePath(root), configBundlePath(root)]) {
      try {
        await unlink(target);
        cleared = true;
      } catch {
        // File did not exist.
      }
    }

    console.log(cleared ? 'Config cache cleared.' : 'No config cache found.');
    return 0;
  }
}
