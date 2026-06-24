import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flattenTranslations } from './load.js';

const CATALOG_DIR = join(dirname(fileURLToPath(import.meta.url)), 'catalogs');

export function frameworkCatalogPath(locale: string): string {
  return join(CATALOG_DIR, `${locale}.json`);
}

export async function loadFrameworkCatalog(locale: string): Promise<Record<string, string>> {
  const { loadLocaleFile } = await import('./load.js');
  const tree = await loadLocaleFile(frameworkCatalogPath(locale));
  return flattenTranslations(tree);
}