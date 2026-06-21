import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { parseOptions, positionalArgs } from '../utils.js';
import { createViewEngine, loadViewConfig } from '../view-config.js';

export class ViewCacheCommand extends Command {
  override readonly name = 'view:cache';
  override readonly description = 'Compile all Tyr templates for production';
  override readonly usage = 'tyravel view:cache';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    positionalArgs(args);

    const root = requireProjectRoot();
    const viewConfig = await loadViewConfig(root);
    const engine = createViewEngine(root, {
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
    const engine = createViewEngine(root, {
      ...viewConfig,
      compiled: true,
      compiledPath: viewConfig.compiledPath ?? 'storage/framework/views',
    });

    const count = engine.clearCompiledCache();
    console.log(`Cleared ${count} compiled view file(s).`);

    return 0;
  }
}

