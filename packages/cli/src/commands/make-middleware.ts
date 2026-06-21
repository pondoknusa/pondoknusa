import { existsSync } from 'node:fs';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { middleware } from '../stubs.js';
import {
  parseOptions,
  positionalArgs,
  projectPath,
  toPascalCase,
  writeFile,
} from '../utils.js';

export class MakeMiddlewareCommand extends Command {
  override readonly name = 'make:middleware';
  override readonly description = 'Create a new HTTP middleware class';
  override readonly usage = 'tyravel make:middleware <Name>';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    const [rawName] = positionalArgs(args);

    if (!rawName) {
      console.error('Middleware name is required.');
      console.error('Usage: tyravel make:middleware <Name>');
      return 1;
    }

    const root = requireProjectRoot();
    const name = toPascalCase(rawName.replace(/Middleware$/i, ''));
    const fileName = `${name}Middleware.ts`;
    const target = projectPath(root, 'src/middleware', fileName);

    if (existsSync(target)) {
      console.error(`Middleware already exists: src/middleware/${fileName}`);
      return 1;
    }

    writeFile(target, middleware(name));
    console.log(`Middleware created: src/middleware/${fileName}`);
    return 0;
  }
}