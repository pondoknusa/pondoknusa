import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { view } from '../stubs.js';
import {
  parseOptions,
  positionalArgs,
  projectPath,
  toKebabCase,
  writeFile,
} from '../utils.js';

export class MakeViewCommand extends Command {
  override readonly name = 'make:view';
  override readonly description = 'Create a new Tyr template view';
  override readonly usage = 'tyravel make:view <name>';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    const [rawName] = positionalArgs(args);

    if (!rawName) {
      console.error('View name is required.');
      console.error('Usage: tyravel make:view <name>');
      return 1;
    }

    const root = requireProjectRoot();
    const dotted = rawName.replace(/\\/g, '/').replace(/\/+/g, '.');
    const segments = dotted.split('.').map((segment) => toKebabCase(segment));
    const fileName = `${segments.at(-1)}.tyr`;
    const directory = segments.slice(0, -1);
    const relativeDir = ['resources', 'views', ...directory].join('/');
    const target = projectPath(root, relativeDir, fileName);

    if (existsSync(target)) {
      console.error(`View already exists: ${relativeDir}/${fileName}`);
      return 1;
    }

    mkdirSync(dirname(target), { recursive: true });
    writeFile(target, view(segments.join('.')));
    console.log(`View created: ${relativeDir}/${fileName}`);

    return 0;
  }
}