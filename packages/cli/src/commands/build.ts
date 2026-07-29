import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  CONFIG_FILE_PATTERN,
  createFullBundlePlugin,
  generateFullBundleEntry,
} from '../config-entry.js';
import { Command } from '../command.js';
import { loadProjectConfig, requireProjectRoot } from '../project.js';
import { optionString, parseOptions, pathExists, positionalArgs } from '../utils.js';

export class BuildCommand extends Command {
  override readonly name = 'build';
  override readonly description = 'Bundle the app entry into a single production file (esbuild)';
  override readonly usage = 'pondoknusa build [--outfile=<path>] [--minify] [--full]';

  async handle(args: string[]): Promise<number> {
    const options = parseOptions(args);
    positionalArgs(args);

    const root = await requireProjectRoot();
    const config = await loadProjectConfig(root);
    const entry = join(root, config.entry);

    if (!(await pathExists(entry))) {
      console.error(`Entry file not found: ${config.entry}`);
      return 1;
    }

    const full = options.full === true || options.full === 'true';

    let esbuild: {
      build: (options: Record<string, unknown>) => Promise<{ errors: unknown[] }>;
    };
    try {
      esbuild = (await import('esbuild')) as typeof esbuild;
    } catch {
      console.error(
        'esbuild is required for pondoknusa build. Install it in your app: npm install -D esbuild',
      );
      return 1;
    }

    const outfile = resolve(
      root,
      optionString(options, 'outfile', 'bootstrap/app.mjs') ?? 'bootstrap/app.mjs',
    );
    const minify = options.minify === true || options.minify === 'true';

    await mkdir(dirname(outfile), { recursive: true });

    let entryPoint = entry;
    let plugins: unknown[] = [];

    if (full) {
      // --full: inline the framework and app code (third-party npm packages
      // stay external) and bake the merged config into the same file, so a
      // cold start reads one module instead of hundreds.
      const configDir = join(root, 'config');
      const configFiles = await readdir(configDir)
        .then((names) => names.filter((name) => CONFIG_FILE_PATTERN.test(name)).sort())
        .catch(() => [] as string[]);

      const entryDir = join(root, 'storage', 'framework');
      await mkdir(entryDir, { recursive: true });
      entryPoint = join(entryDir, 'build-entry.mjs');
      await writeFile(
        entryPoint,
        generateFullBundleEntry({ root, entryDir, appEntry: entry, configFiles }),
        'utf8',
      );
      plugins = [createFullBundlePlugin()];
    }

    const result = await esbuild.build({
      entryPoints: [entryPoint],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node26',
      minify,
      // Class names are load-bearing (event registry keys off
      // constructor.name, model/table resolution, etc.) — never rename them,
      // even when minifying.
      keepNames: true,
      sourcemap: true,
      ...(full ? { plugins } : { packages: 'external' }),
      banner: {
        js: '// Pondoknusa production bundle — see docs/guide/performance.md#single-file-bundle',
      },
    });

    if (result.errors.length > 0) {
      console.error('Build failed.');
      return 1;
    }

    const readme = join(dirname(outfile), 'README.txt');
    await writeFile(
      readme,
      [
        'Pondoknusa production bundle',
        '',
        'Run: node bootstrap/app.mjs',
        '',
        'Trade-offs:',
        '- Faster cold start on edge runtimes; no per-request TypeScript compile.',
        '- Native addons and dynamic imports may need extra esbuild plugins.',
        full
          ? '- Built with --full: config is baked in; rebuild after changing config/*. (route:cache/view:cache outputs are still read from storage/framework at boot.)'
          : '- Run pondoknusa config:cache, route:cache, and view:cache before bundling.',
        '',
      ].join('\n'),
      'utf8',
    );

    console.log(`Bundled ${config.entry}${full ? ' (full)' : ''} → ${outfile}`);
    return 0;
  }
}