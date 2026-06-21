import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import type { CompiledTemplate } from './types.js';

export interface SerializedCacheEntry {
  mtimeMs: number;
  registryVersion: number;
  template: CompiledTemplate;
}

export function cacheFileForView(
  cacheDirectory: string,
  viewsRoot: string,
  sourcePath: string,
): string {
  const relativePath = relative(viewsRoot, sourcePath);
  const hash = createHash('sha256').update(relativePath).digest('hex');
  return join(cacheDirectory, `${hash}.json`);
}

export function readCompiledCache(cacheFile: string): SerializedCacheEntry | null {
  try {
    const raw = readFileSync(cacheFile, 'utf8');
    return JSON.parse(raw) as SerializedCacheEntry;
  } catch {
    return null;
  }
}

export function writeCompiledCache(cacheFile: string, entry: SerializedCacheEntry): void {
  mkdirSync(dirname(cacheFile), { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(entry), 'utf8');
}

export function clearCompiledCacheDir(cacheDirectory: string): number {
  if (!existsSync(cacheDirectory)) {
    return 0;
  }

  let removed = 0;
  for (const entry of readdirSync(cacheDirectory)) {
    if (!entry.endsWith('.json')) {
      continue;
    }
    rmSync(join(cacheDirectory, entry));
    removed += 1;
  }
  return removed;
}

export function discoverViewNames(
  viewsDirectory: string,
  extension: string,
  prefix = '',
): string[] {
  if (!existsSync(viewsDirectory)) {
    return [];
  }

  const names: string[] = [];

  for (const entry of readdirSync(viewsDirectory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const nestedPrefix = prefix ? `${prefix}.${entry.name}` : entry.name;
      names.push(
        ...discoverViewNames(join(viewsDirectory, entry.name), extension, nestedPrefix),
      );
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(extension)) {
      continue;
    }

    const baseName = entry.name.slice(0, -extension.length);
    names.push(prefix ? `${prefix}.${baseName}` : baseName);
  }

  return names.sort();
}

