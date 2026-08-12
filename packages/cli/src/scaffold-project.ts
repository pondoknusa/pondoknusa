import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathExists } from './utils.js';

export function generateAppKey(): string {
  return randomBytes(32).toString('base64url');
}

export async function createStorageTree(root: string, headless: boolean): Promise<void> {
  const directories = [
    'storage/app',
    'storage/framework',
    'storage/framework/cache',
    'storage/logs',
  ];

  if (!headless) {
    directories.push('storage/framework/views');
  }

  for (const directory of directories) {
    const target = join(root, directory);
    await mkdir(target, { recursive: true });
    await writeFile(join(target, '.gitkeep'), '');
  }
}

export function projectGitignore(): string {
  return `# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Pondoknusa runtime / debug
.pondoknusa/

# Production build output (pondoknusa build)
bootstrap/

# Cache artifacts (config/route/view caches, build entry)
storage/*
!storage/**/.gitkeep

# SQLite runtime files
database/*.sqlite
database/*.sqlite-shm
database/*.sqlite-wal

# Coverage / test
coverage/
*.lcov

# Logs
*.log
npm-debug.log*

# OS / editor
.DS_Store
Thumbs.db
`;
}

export async function ensureGitignore(root: string): Promise<void> {
  const target = join(root, '.gitignore');
  if (await pathExists(target)) {
    return;
  }
  await writeFile(target, projectGitignore(), 'utf8');
}

export async function tryGitInit(root: string): Promise<boolean> {
  if (await pathExists(join(root, '.git'))) {
    return false;
  }

  const { spawn } = await import('node:child_process');
  return new Promise((resolvePromise) => {
    const proc = spawn('git', ['init'], {
      cwd: root,
      stdio: 'ignore',
    });
    proc.on('close', (code) => resolvePromise(code === 0));
    proc.on('error', () => resolvePromise(false));
  });
}

export async function upsertEnvKey(envPath: string, key: string, value: string): Promise<void> {
  const { readFile, writeFile: write } = await import('node:fs/promises');
  let contents = '';
  try {
    contents = await readFile(envPath, 'utf8');
  } catch {
    contents = '';
  }

  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(contents)) {
    contents = contents.replace(pattern, line);
  } else if (contents.trim().length === 0) {
    contents = `${line}\n`;
  } else {
    contents = `${contents.trimEnd()}\n${line}\n`;
  }

  await write(envPath, contents, 'utf8');
}
