import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProjectEnv } from './load-env.js';
import type { ConfigTree } from './repository.js';
import type { ConfigSchema } from './schema.js';
import { validateConfig } from './validate-config.js';
import { validateBootEnv } from './validate-boot-env.js';

export interface LoadedConfig {
  config: ConfigTree;
  schemas: Record<string, ConfigSchema>;
}

export interface LoadConfigOptions {
  validate?: boolean;
}

export async function loadConfig(
  basePath: string,
  options: LoadConfigOptions = {},
): Promise<ConfigTree> {
  const loaded = await loadConfigWithSchemas(basePath);
  if (options.validate !== false) {
    if (Object.keys(loaded.schemas).length > 0) {
      validateConfig(loaded.config, loaded.schemas);
    }
    validateBootEnv(loaded.config);
  }
  return loaded.config;
}

export async function loadConfigWithSchemas(basePath: string): Promise<LoadedConfig> {
  await loadProjectEnv(basePath);

  const configDir = join(basePath, 'config');
  const entries = await readdir(configDir, { withFileTypes: true });
  const config: ConfigTree = {};
  const schemas: Record<string, ConfigSchema> = {};

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

    if (loaded.schema && typeof loaded.schema.validate === 'function') {
      schemas[key] = loaded.schema as ConfigSchema;
    }
  }

  return { config, schemas };
}