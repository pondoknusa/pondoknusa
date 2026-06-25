import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function importRoutes(
  root: string,
): Promise<{ registerRoutes?: () => void } | undefined> {
  const candidates = [
    join(root, 'src/routes/index.js'),
    join(root, 'src/routes/index.ts'),
    join(root, 'src/routes/web.js'),
    join(root, 'src/routes/web.ts'),
  ];

  for (const target of candidates) {
    try {
      const { access } = await import('node:fs/promises');
      await access(target);
      return import(pathToFileURL(target).href) as Promise<{ registerRoutes?: () => void }>;
    } catch {
      continue;
    }
  }

  return undefined;
}