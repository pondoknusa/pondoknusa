import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TranslationTree } from './types.js';

export function flattenTranslations(
  tree: TranslationTree,
  prefix = '',
): Record<string, string> {
  const flat: Record<string, string> = {};

  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      flat[path] = value;
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flat, flattenTranslations(value as TranslationTree, path));
    }
  }

  return flat;
}

export async function loadLocaleFile(path: string): Promise<TranslationTree> {
  const source = await readFile(path, 'utf8');
  const parsed = JSON.parse(source) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }
  return parsed as TranslationTree;
}

export function resolveLocalePath(
  basePath: string,
  localesPath: string,
  locale: string,
): string {
  return join(basePath, localesPath, `${locale}.json`);
}

export async function loadLocaleTranslations(
  basePath: string,
  localesPath: string,
  locale: string,
): Promise<Record<string, string>> {
  const localePath = resolveLocalePath(basePath, localesPath, locale);
  try {
    const tree = await loadLocaleFile(localePath);
    return flattenTranslations(tree);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}