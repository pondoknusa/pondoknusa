import { Command } from '../command.js';
import { generateAppKey, upsertEnvKey } from '../scaffold-project.js';
import { requireProjectRoot } from '../project.js';
import { optionFlag, parseOptions, pathExists, projectPath } from '../utils.js';

export class KeyGenerateCommand extends Command {
  override readonly name = 'key:generate';
  override readonly description = 'Generate and set APP_KEY in .env';
  override readonly usage = 'pondoknusa key:generate [--force]';

  async handle(args: string[]): Promise<number> {
    const options = parseOptions(args);
    const force = optionFlag(options, 'force');
    const root = await requireProjectRoot();
    const envPath = projectPath(root, '.env');
    const examplePath = projectPath(root, '.env.example');

    if (!(await pathExists(envPath))) {
      console.error('.env not found. Create one from .env.example first.');
      return 1;
    }

    const { readFile } = await import('node:fs/promises');
    const existing = await readFile(envPath, 'utf8');
    const match = existing.match(/^APP_KEY=(.*)$/m);
    const current = match?.[1]?.trim() ?? '';

    if (current.length > 0 && !force) {
      console.error('APP_KEY already set. Pass --force to rotate it.');
      return 1;
    }

    const key = generateAppKey();
    await upsertEnvKey(envPath, 'APP_KEY', key);
    if (await pathExists(examplePath)) {
      await upsertEnvKey(examplePath, 'APP_KEY', key);
    }

    console.log(`APP_KEY set (${key.length} characters).`);
    return 0;
  }
}
