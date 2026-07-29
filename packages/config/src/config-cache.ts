import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig } from './loader.js';
import type { ConfigTree } from './repository.js';

export const CONFIG_CACHE_RELATIVE_PATH = 'storage/framework/config.json';
export const CONFIG_BUNDLE_RELATIVE_PATH = 'storage/framework/config.mjs';

export interface ConfigFileFingerprint {
  name: string;
  mtimeMs: number;
}

/**
 * Cache manifest (version 2). The merged config tree itself is NOT embedded:
 * config values may hold class references and closures that JSON cannot
 * represent. Instead the manifest points at a bundled ESM module
 * (see {@link CONFIG_BUNDLE_RELATIVE_PATH}) produced by `pondoknusa
 * config:cache`, which preserves live class references.
 */
export interface ConfigCacheManifest {
  version: 2;
  generatedAt: string;
  files: ConfigFileFingerprint[];
  /** Path to the bundled config module, relative to the manifest directory. */
  bundle: string;
}

export interface ConfigBootResult {
  loaded: boolean;
  config: ConfigTree;
  message?: string;
}

export function configCachePath(basePath: string): string {
  return join(basePath, CONFIG_CACHE_RELATIVE_PATH);
}

export function configBundlePath(basePath: string): string {
  return join(basePath, CONFIG_BUNDLE_RELATIVE_PATH);
}

export async function collectConfigFingerprints(
  basePath: string,
): Promise<ConfigFileFingerprint[]> {
  const fingerprints: ConfigFileFingerprint[] = [];
  const configDir = join(basePath, 'config');

  try {
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(configDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      if (!/^(.+)\.(ts|js|mjs)$/.test(entry.name)) {
        continue;
      }

      const fileStat = await stat(join(configDir, entry.name));
      fingerprints.push({ name: entry.name, mtimeMs: fileStat.mtimeMs });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  const envPath = join(basePath, '.env');
  try {
    const envStat = await stat(envPath);
    fingerprints.push({ name: '.env', mtimeMs: envStat.mtimeMs });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  return fingerprints.sort((left, right) => left.name.localeCompare(right.name));
}

export function fingerprintsMatch(
  cached: ConfigFileFingerprint[],
  current: ConfigFileFingerprint[],
): boolean {
  if (cached.length !== current.length) {
    return false;
  }

  const sortedCached = [...cached].sort((left, right) => left.name.localeCompare(right.name));
  const sortedCurrent = [...current].sort((left, right) => left.name.localeCompare(right.name));

  return sortedCached.every(
    (entry, index) =>
      entry.name === sortedCurrent[index]?.name
      && entry.mtimeMs === sortedCurrent[index]?.mtimeMs,
  );
}

export async function buildConfigCacheManifest(
  basePath: string,
): Promise<ConfigCacheManifest> {
  const files = await collectConfigFingerprints(basePath);

  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    files,
    bundle: 'config.mjs',
  };
}

export async function readConfigCacheManifest(
  basePath: string,
): Promise<ConfigCacheManifest | null> {
  try {
    const raw = await readFile(configCachePath(basePath), 'utf8');
    const manifest = JSON.parse(raw) as ConfigCacheManifest;

    if (
      manifest.version !== 2
      || typeof manifest.bundle !== 'string'
      || !Array.isArray(manifest.files)
    ) {
      return null;
    }

    return manifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    return null;
  }
}

async function loadCachedConfigBundle(
  basePath: string,
  manifest: ConfigCacheManifest,
): Promise<ConfigTree> {
  const bundlePath = join(basePath, 'storage', 'framework', manifest.bundle);
  const moduleUrl = pathToFileURL(bundlePath).href;
  const loaded = await import(moduleUrl);
  return (loaded.default ?? loaded) as ConfigTree;
}

export async function resolveConfigForBoot(
  basePath: string,
  options: { productionOnly?: boolean } = {},
): Promise<ConfigBootResult> {
  const productionOnly = options.productionOnly ?? true;
  const environment = process.env.NODE_ENV ?? 'development';

  if (productionOnly && environment !== 'production') {
    return {
      loaded: false,
      config: await loadConfig(basePath),
    };
  }

  try {
    const manifest = await readConfigCacheManifest(basePath);
    if (!manifest) {
      return {
        loaded: false,
        config: await loadConfig(basePath),
      };
    }

    const current = await collectConfigFingerprints(basePath);
    if (!fingerprintsMatch(manifest.files, current)) {
      return {
        loaded: false,
        config: await loadConfig(basePath),
        message: 'Config cache is stale — run `pondoknusa config:cache`',
      };
    }

    return {
      loaded: true,
      config: await loadCachedConfigBundle(basePath, manifest),
      message: `Loaded cached config (${manifest.files.length} source file(s))`,
    };
  } catch (error) {
    return {
      loaded: false,
      config: await loadConfig(basePath),
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
