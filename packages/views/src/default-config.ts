import type { ViewConfig } from './types.js';

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  path: 'resources/views',
  extension: '.tyr',
  programmaticExtension: '.tyr.ts',
  compiled: (process.env.NODE_ENV ?? 'production') === 'production',
  compiledPath: 'storage/framework/views',
  env: process.env.NODE_ENV ?? 'production',
};