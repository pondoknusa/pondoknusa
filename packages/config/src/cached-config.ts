import type { ConfigTree } from './repository.js';

let embeddedConfig: ConfigTree | null = null;

/**
 * Register a config tree baked in at build time (`pondoknusa build --full`).
 * The generated bundle calls this before importing the application entry, so
 * the whole config graph ships inside a single module: no per-file imports at
 * boot, and class references in config stay alive (unlike JSON manifests).
 */
export function registerCachedConfig(config: ConfigTree): void {
  embeddedConfig = config;
}

export function getCachedConfig(): ConfigTree | null {
  return embeddedConfig;
}
