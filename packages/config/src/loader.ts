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

  const files = entries.filter((entry) => {
    if (!entry.isFile()) {
      return false;
    }

    const match = entry.name.match(/^(.+)\.(ts|js|mjs)$/);
    return match !== null && Boolean(match[1]);
  });

  // Import config modules concurrently; assemble in directory order below so
  // duplicate keys (e.g. app.ts and app.js) resolve exactly as the old
  // sequential loader did — last file wins.
  const loaded = await Promise.all(
    files.map(async (entry) => {
      const key = entry.name.match(/^(.+)\.(ts|js|mjs)$/)![1]!;
      const moduleUrl = pathToFileURL(join(configDir, entry.name)).href;
      const mod = await import(moduleUrl);
      return { key, mod };
    }),
  );

  for (const { key, mod } of loaded) {
    config[key] = mod.default ?? mod;

    if (mod.schema && typeof mod.schema.validate === 'function') {
      schemas[key] = mod.schema as ConfigSchema;
    }
  }

  return { config, schemas };
}