import { existsSync } from 'node:fs';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { model } from '../stubs.js';
import {
  parseOptions,
  positionalArgs,
  projectPath,
  toPascalCase,
  writeFile,
} from '../utils.js';

export class MakeModelCommand extends Command {
  override readonly name = 'make:model';
  override readonly description = 'Create a new Eloquent model class';
  override readonly usage = 'tyravel make:model <Name>';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    const [rawName] = positionalArgs(args);

    if (!rawName) {
      console.error('Model name is required.');
      console.error('Usage: tyravel make:model <Name>');
      return 1;
    }

    const root = requireProjectRoot();
    const name = toPascalCase(rawName);
    const fileName = `${name}.ts`;
    const target = projectPath(root, 'src/models', fileName);

    if (existsSync(target)) {
      console.error(`Model already exists: src/models/${fileName}`);
      return 1;
    }

    writeFile(target, model(name));
    console.log(`Model created: src/models/${fileName}`);

    return 0;
  }
}