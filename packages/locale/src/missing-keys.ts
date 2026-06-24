import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { flattenTranslations } from './load.js';

export async function collectLocaleKeys(
  basePath: string,
  localesPath: string,
): Promise<Set<string>> {
  const directory = join(basePath, localesPath);
  const keys = new Set<string>();

  let files: string[];
  try {
    files = await readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return keys;
    }
    throw error;
  }

  for (const file of files) {
    if (!file.endsWith('.json')) {
      continue;
    }
    const source = await readFile(join(directory, file), 'utf8');
    const parsed = JSON.parse(source) as Record<string, unknown>;
    for (const key of Object.keys(flattenTranslations(parsed))) {
      keys.add(key);
    }
  }

  return keys;
}

export function diffMissingKeys(
  required: Iterable<string>,
  present: Set<string>,
): string[] {
  const missing: string[] = [];
  for (const key of required) {
    if (!present.has(key)) {
      missing.push(key);
    }
  }
  return missing.sort();
}