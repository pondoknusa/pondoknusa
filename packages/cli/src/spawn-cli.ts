import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

export function resolveTyravelBin(root: string): string {
  const name = process.platform === 'win32' ? 'tyravel.cmd' : 'tyravel';
  return join(root, 'node_modules', '.bin', name);
}

export function spawnTyravelCommand(
  root: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): ChildProcess {
  const bin = resolveTyravelBin(root);
  return spawn(bin, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
}