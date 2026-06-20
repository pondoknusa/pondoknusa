import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from '../command.js';

export class VersionCommand extends Command {
  override readonly name = 'version';
  override readonly description = 'Show the Tyravel CLI version';

  async handle(): Promise<number> {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = join(currentDir, '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version: string };

    console.log(`Tyravel CLI ${pkg.version}`);
    return 0;
  }
}