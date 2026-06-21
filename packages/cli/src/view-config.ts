import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ViewEngine, type ViewConfig } from '@tyravel/views';

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  path: 'resources/views',
  extension: '.tyr',
  compiled: (process.env.NODE_ENV ?? 'production') === 'production',
  compiledPath: 'storage/framework/views',
};

export async function loadViewConfig(root: string): Promise<ViewConfig> {
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

export function createViewEngine(root: string, viewConfig: ViewConfig): ViewEngine {
  return new ViewEngine(root, viewConfig);
}