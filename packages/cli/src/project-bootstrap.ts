import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function importAppServiceProvider(
  root: string,
): Promise<Record<string, unknown> | undefined> {
  const providerPath = join(root, 'src/providers/app-service-provider.ts');
  const providerJsPath = join(root, 'src/providers/app-service-provider.js');

  for (const target of [providerJsPath, providerPath]) {
    try {
      const { access } = await import('node:fs/promises');
      await access(target);
      return import(pathToFileURL(target).href) as Promise<Record<string, unknown>>;
    } catch {
      continue;
    }
  }

  return undefined;
}

export async function importProjectRoutes(
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