import { existsSync } from 'node:fs';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { consoleCommand } from '../stubs.js';
import {
  parseOptions,
  positionalArgs,
  projectPath,
  toKebabCase,
  toPascalCase,
  writeFile,
} from '../utils.js';

export class MakeCommandCommand extends Command {
  override readonly name = 'make:command';
  override readonly description = 'Create a new console command class';
  override readonly usage = 'tyravel make:command <Name>';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    const [rawName] = positionalArgs(args);

    if (!rawName) {
      console.error('Command name is required.');
      console.error('Usage: tyravel make:command <Name>');
      return 1;
    }

    const root = requireProjectRoot();
    const name = toPascalCase(rawName.replace(/Command$/i, ''));
    const signature = toKebabCase(name);
    const fileName = `${name}Command.ts`;
    const target = projectPath(root, 'src/commands', fileName);

    if (existsSync(target)) {
      console.error(`Command already exists: src/commands/${fileName}`);
      return 1;
    }

    writeFile(target, consoleCommand(name, signature));
    console.log(`Command created: src/commands/${fileName}`);
    return 0;
  }
}