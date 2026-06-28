import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export interface TyravelConfig {
  name: string;
  entry: string;
  mode?: 'headless' | 'full';
  serve: {
    port: number;
    hostname: string;
  };
}

const PROJECT_MARKERS = ['tyravel.json', 'src/main.ts'] as const;

export async function findProjectRoot(startDir = process.cwd()): Promise<string | undefined> {
  let current = resolve(startDir);

  while (true) {
    const markers = await Promise.all(
      PROJECT_MARKERS.map(async (marker) => {
        try {
          await access(join(current, marker), constants.F_OK);
          return true;
        } catch {
          return false;
        }
      }),
    );

    if (markers.every(Boolean)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

export async function loadProjectConfig(root: string): Promise<TyravelConfig> {
  const configPath = join(root, 'tyravel.json');
  const raw = await readFile(configPath, 'utf8');
  try {
    return JSON.parse(raw) as TyravelConfig;
  } catch {
    throw new Error(`Invalid JSON in ${configPath}`);
  }
}

export async function requireProjectRoot(startDir = process.cwd()): Promise<string> {
  const root = await findProjectRoot(startDir);
  if (!root) {
    throw new Error(
      'Could not find a Tyravel project. Run this command from an app directory or use `tyravel new`.',
    );
  }
  return root;
}

