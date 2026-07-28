import { access, readdir, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const PROJECT_MARKERS = ['pondoknusa.json', 'src/main.ts'] as const;

export interface ProjectConfig {
  name?: string;
  entry?: string;
  mode?: string;
}

export interface ProjectInfo {
  root: string;
  config: ProjectConfig;
  entryPath: string;
  mode: 'web' | 'headless';
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function findProjectRoot(start: string = process.cwd()): Promise<string | undefined> {
  let current = resolve(start);

  while (true) {
    for (const marker of PROJECT_MARKERS) {
      if (await pathExists(join(current, marker))) {
        return current;
      }
    }

    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

export async function requireProjectRoot(start?: string): Promise<string> {
  const root = await findProjectRoot(start);
  if (!root) {
    throw new Error(
      'Could not find a Pondoknusa project (looking for pondoknusa.json or src/main.ts).',
    );
  }
  return root;
}

export async function loadProjectConfig(root: string): Promise<ProjectConfig> {
  const configPath = join(root, 'pondoknusa.json');
  if (!(await pathExists(configPath))) {
    return {};
  }

  try {
    const raw = await readFile(configPath, 'utf8');
    return JSON.parse(raw) as ProjectConfig;
  } catch {
    return {};
  }
}

export async function resolveProject(root: string): Promise<ProjectInfo> {
  const config = await loadProjectConfig(root);
  const entryRelative = config.entry ?? 'src/main.ts';
  const entryPath = join(root, entryRelative);
  const mode = config.mode === 'headless' ? 'headless' : 'web';

  return { root, config, entryPath, mode };
}

export async function readSource(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return undefined;
  }
}

export async function listSourceFiles(
  dir: string,
  extensions: string[] = ['.ts', '.js'],
): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') {
          continue;
        }
        await walk(full);
        continue;
      }

      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  }

  await walk(dir);
  return results;
}

export function toProjectRelative(root: string, absolute: string): string {
  return relative(root, absolute).replace(/\\/g, '/');
}

export function lineNumberAt(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') {
      line += 1;
    }
  }
  return line;
}

export function columnAt(source: string, index: number): number {
  let column = 1;
  for (let i = index - 1; i >= 0; i -= 1) {
    if (source[i] === '\n') {
      break;
    }
    column += 1;
  }
  return column;
}
