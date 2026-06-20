import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ConfigTree } from './repository.js';

export async function loadConfig(basePath: string): Promise<ConfigTree> {
  const configDir = join(basePath, 'config');
  const entries = readdirSync(configDir, { withFileTypes: true });
  const config: ConfigTree = {};

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const match = entry.name.match(/^(.+)\.(ts|js|mjs)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    if (!key) {
      continue;
    }

    const moduleUrl = pathToFileURL(join(configDir, entry.name)).href;
    const loaded = await import(moduleUrl);
    config[key] = loaded.default ?? loaded;
  }

  return config;
}