import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ViewEngine, type ViewConfig } from '@tyravel/views';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { parseOptions, positionalArgs } from '../utils.js';

const DEFAULT_VIEW_CONFIG: ViewConfig = {
  path: 'resources/views',
  extension: '.tyr',
  compiled: true,
  compiledPath: 'storage/framework/views',
};

export class ViewCacheCommand extends Command {
  override readonly name = 'view:cache';
  override readonly description = 'Compile all Tyr templates for production';
  override readonly usage = 'tyravel view:cache';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    positionalArgs(args);

    const root = requireProjectRoot();
    const viewConfig = await loadViewConfig(root);
    const engine = new ViewEngine(root, {
      ...viewConfig,
      compiled: true,
      compiledPath: viewConfig.compiledPath ?? 'storage/framework/views',
    });

    const count = await engine.warmCompiledCache();
    console.log(`Compiled ${count} view(s) to ${viewConfig.compiledPath ?? 'storage/framework/views'}.`);

    return 0;
  }
}

export class ViewClearCommand extends Command {
  override readonly name = 'view:clear';
  override readonly description = 'Clear compiled Tyr template cache';
  override readonly usage = 'tyravel view:clear';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    positionalArgs(args);

    const root = requireProjectRoot();
    const viewConfig = await loadViewConfig(root);
    const engine = new ViewEngine(root, {
      ...viewConfig,
      compiled: true,
      compiledPath: viewConfig.compiledPath ?? 'storage/framework/views',
    });

    const count = engine.clearCompiledCache();
    console.log(`Cleared ${count} compiled view file(s).`);

    return 0;
  }
}

async function loadViewConfig(root: string): Promise<ViewConfig> {
  const configPath = join(root, 'config/views.ts');
  const configJsPath = join(root, 'config/views.js');

  for (const target of [configJsPath, configPath]) {
    try {
      const { access } = await import('node:fs/promises');
      await access(target);
      const loaded = await import(pathToFileURL(target).href);
      return { ...DEFAULT_VIEW_CONFIG, ...(loaded.default as ViewConfig) };
    } catch {
      continue;
    }
  }

  return DEFAULT_VIEW_CONFIG;
}