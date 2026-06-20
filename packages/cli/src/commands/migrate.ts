import { join } from 'node:path';
import { loadConfig } from '@tyravel/config';
import { DatabaseManager, Migrator } from '@tyravel/database';
import type { DatabaseConfig } from '@tyravel/database';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { parseOptions, positionalArgs } from '../utils.js';

export class MigrateCommand extends Command {
  override readonly name = 'migrate';
  override readonly description = 'Run database migrations';
  override readonly usage = 'tyravel migrate';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    positionalArgs(args);

    const root = requireProjectRoot();
    const config = await loadConfig(root);
    const database = config.database as DatabaseConfig | undefined;

    if (!database) {
      console.error('Database config not found. Add config/database.ts to your app.');
      return 1;
    }

    const manager = new DatabaseManager(database, root);
    const migrator = new Migrator(
      manager.connection(),
      join(root, 'database/migrations'),
    );

    const ran = await migrator.run();

    if (ran.length === 0) {
      console.log('Nothing to migrate.');
      return 0;
    }

    console.log(`Migrated: ${ran.join(', ')}`);
    return 0;
  }
}