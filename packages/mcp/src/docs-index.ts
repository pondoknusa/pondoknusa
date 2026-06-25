import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export async function discoverDocs(root: string, docsDir = 'docs'): Promise<import('./types.js').DocEntry[]> {
  const base = join(root, docsDir);
  const entries: import('./types.js').DocEntry[] = [];

  await walkMarkdown(base, base, entries);
  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

async function walkMarkdown(
  base: string,
  current: string,
  entries: import('./types.js').DocEntry[],
): Promise<void> {
  let files: string[];
  try {
    files = await readdir(current);
  } catch {
    return;
  }

  for (const file of files) {
    const path = join(current, file);
    if (file.endsWith('.md')) {
      const content = await readFile(path, 'utf8');
      entries.push({
        path: relative(base, path).replaceAll('\\', '/'),
        title: extractTitle(content) ?? file.replace(/\.md$/, ''),
      });
      continue;
    }

    if (!file.includes('.')) {
      await walkMarkdown(base, path, entries);
    }
  }
}

function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}