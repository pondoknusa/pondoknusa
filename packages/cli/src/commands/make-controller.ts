import { existsSync } from 'node:fs';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { controller } from '../stubs.js';
import {
  parseOptions,
  positionalArgs,
  projectPath,
  toPascalCase,
  writeFile,
} from '../utils.js';

export class MakeControllerCommand extends Command {
  override readonly name = 'make:controller';
  override readonly description = 'Create a new HTTP controller class';
  override readonly usage = 'tyravel make:controller <Name>';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    const [rawName] = positionalArgs(args);

    if (!rawName) {
      console.error('Controller name is required.');
      console.error('Usage: tyravel make:controller <Name>');
      return 1;
    }

    const root = requireProjectRoot();
    const name = toPascalCase(rawName.replace(/Controller$/i, ''));
    const fileName = `${name}Controller.ts`;
    const target = projectPath(root, 'src/controllers', fileName);

    if (existsSync(target)) {
      console.error(`Controller already exists: src/controllers/${fileName}`);
      return 1;
    }

    writeFile(target, controller(name));
    console.log(`Controller created: src/controllers/${fileName}`);

    return 0;
  }
}