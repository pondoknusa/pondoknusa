import { ConsoleKernel } from './console.js';
import { MakeControllerCommand } from './commands/make-controller.js';
import { MakeJobCommand } from './commands/make-job.js';
import { MakeMigrationCommand } from './commands/make-migration.js';
import { MakeModelCommand } from './commands/make-model.js';
import { MakeProviderCommand } from './commands/make-provider.js';
import { MakeViewCommand } from './commands/make-view.js';
import { MigrateCommand } from './commands/migrate.js';
import { NewCommand } from './commands/new.js';
import { QueueTableCommand } from './commands/queue-table.js';
import { QueueWorkCommand } from './commands/queue-work.js';
import { ServeCommand } from './commands/serve.js';
import { VersionCommand } from './commands/version.js';

export function createKernel(): ConsoleKernel {
  return new ConsoleKernel([
    new NewCommand(),
    new ServeCommand(),
    new MigrateCommand(),
    new MakeControllerCommand(),
    new MakeModelCommand(),
    new MakeMigrationCommand(),
    new MakeProviderCommand(),
    new MakeViewCommand(),
    new MakeJobCommand(),
    new QueueTableCommand(),
    new QueueWorkCommand(),
    new VersionCommand(),
  ]);
}