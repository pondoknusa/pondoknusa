import { existsSync } from 'node:fs';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { domainEvent } from '../stubs.js';
import {
  parseOptions,
  positionalArgs,
  projectPath,
  toPascalCase,
  writeFile,
} from '../utils.js';

export class MakeEventCommand extends Command {
  override readonly name = 'make:event';
  override readonly description = 'Create a new domain event class';
  override readonly usage = 'tyravel make:event <Name>';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    const [rawName] = positionalArgs(args);

    if (!rawName) {
      console.error('Event name is required.');
      console.error('Usage: tyravel make:event <Name>');
      return 1;
    }

    const root = requireProjectRoot();
    const name = toPascalCase(rawName);
    const fileName = `${name}.ts`;
    const target = projectPath(root, 'src/events', fileName);

    if (existsSync(target)) {
      console.error(`Event already exists: src/events/${fileName}`);
      return 1;
    }

    writeFile(target, domainEvent(name));
    console.log(`Event created: src/events/${fileName}`);

    return 0;
  }
}