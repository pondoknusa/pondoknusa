import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { parseOptions, positionalArgs } from '../utils.js';

export class TestCommand extends Command {
  override readonly name = 'test';
  override readonly description = 'Run the project test suite via Vitest';
  override readonly usage = 'tyravel test [-- <vitest args>]';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    const positional = positionalArgs(args);

    const root = await requireProjectRoot();
    const vitestBin = join(
      root,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'vitest.cmd' : 'vitest',
    );

    const vitestArgs = positional.length > 0 ? positional : ['run'];

    const code = await new Promise<number>((resolvePromise) => {
      const proc = spawn(vitestBin, vitestArgs, {
        cwd: root,
        stdio: 'inherit',
        env: {
          ...process.env,
          APP_ENV: 'testing',
          NODE_ENV: 'test',
        },
        shell: process.platform === 'win32',
      });

      proc.on('close', (exitCode) => resolvePromise(exitCode ?? 1));
      proc.on('error', () => resolvePromise(1));
    });

    return code;
  }
}