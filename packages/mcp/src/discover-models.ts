import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ModelEntry } from './types.js';

export async function discoverModels(root: string, modelsDir = 'src/models'): Promise<ModelEntry[]> {
  const base = join(root, modelsDir);
  let files: string[];
  try {
    files = await readdir(base);
  } catch {
    return [];
  }

  const entries: ModelEntry[] = [];
  for (const file of files) {
    if (!/\.(ts|js)$/.test(file)) {
      continue;
    }

    const path = join(base, file);
    const content = await readFile(path, 'utf8');
    const className = extractModelClassName(content) ?? toPascalCase(file.replace(/\.(ts|js)$/, ''));
    const table = extractStaticTable(content);

    entries.push({
      name: className,
      file: `${modelsDir}/${file}`,
      table,
    });
  }

  return entries.sort((left, right) => left.name.localeCompare(right.name));
}

function extractModelClassName(content: string): string | undefined {
  const match = content.match(/export\s+class\s+(\w+)\s+extends\s+Model/);
  return match?.[1];
}

function extractStaticTable(content: string): string | undefined {
  const match = content.match(/static\s+override\s+table\s*=\s*['"`]([^'"`]+)['"`]/);
  return match?.[1];
}

function toPascalCase(value: string): string {
  return value
    .split(/[-_]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}