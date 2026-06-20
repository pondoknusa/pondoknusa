import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from '../command.js';
import {
  appConfig,
  databaseConfig,
  appServiceProvider,
  layoutView,
  mainEntry,
  projectConfig,
  projectPackageJson,
  viewsConfig,
  webRoutes,
} from '../stubs.js';
import {
  optionString,
  parseOptions,
  positionalArgs,
  projectPath,
  toKebabCase,
  writeFile,
} from '../utils.js';

export class NewCommand extends Command {
  override readonly name = 'new';
  override readonly description = 'Create a new Tyravel application';
  override readonly usage = 'tyravel new <name> [--path=<directory>]';

  async handle(args: string[]): Promise<number> {
    const options = parseOptions(args);
    const [rawName] = positionalArgs(args);

    if (!rawName) {
      console.error('Project name is required.');
      console.error('Usage: tyravel new <name> [--path=<directory>]');
      return 1;
    }

    const name = toKebabCase(rawName);
    const parentDir = optionString(options, 'path', process.cwd()) ?? process.cwd();
    const targetDir = resolve(parentDir, name);

    if (existsSync(targetDir)) {
      console.error(`Directory already exists: ${targetDir}`);
      return 1;
    }

    writeFile(projectPath(targetDir, 'package.json'), projectPackageJson(name));
    writeFile(projectPath(targetDir, 'tyravel.json'), projectConfig(name));
    writeFile(projectPath(targetDir, 'config/app.ts'), appConfig(name));
    writeFile(projectPath(targetDir, 'config/database.ts'), databaseConfig());
    writeFile(projectPath(targetDir, 'config/views.ts'), viewsConfig());
    writeFile(
      projectPath(targetDir, 'resources/views/layouts/app.tyr'),
      layoutView(),
    );
    writeFile(projectPath(targetDir, 'database/migrations/.gitkeep'), '');
    writeFile(projectPath(targetDir, 'src/main.ts'), mainEntry());
    writeFile(
      projectPath(targetDir, 'src/providers/app-service-provider.ts'),
      appServiceProvider(),
    );
    writeFile(projectPath(targetDir, 'src/routes/web.ts'), webRoutes());

    console.log(`Tyravel application created successfully.`);
    console.log('');
    console.log(`  cd ${name}`);
    console.log('  npm install');
    console.log('  tyravel serve');

    return 0;
  }
}