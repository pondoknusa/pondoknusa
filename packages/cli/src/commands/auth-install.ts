import { existsSync } from 'node:fs';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import {
  authConfig,
  authController,
  authRoutes,
  mainEntryWithAuth,
  sessionsTableMigration,
  userModel,
  usersTableMigration,
} from '../stubs.js';
import { projectPath, writeFile } from '../utils.js';

export class AuthInstallCommand extends Command {
  override readonly name = 'auth:install';
  override readonly description = 'Scaffold session auth (config, User model, routes, migrations)';
  override readonly usage = 'tyravel auth:install';

  async handle(): Promise<number> {
    const root = requireProjectRoot();

    const configPath = projectPath(root, 'config/auth.ts');
    if (existsSync(configPath)) {
      console.error('config/auth.ts already exists.');
      return 1;
    }

    writeFile(configPath, authConfig());
    writeFile(projectPath(root, 'src/models/User.ts'), userModel());
    writeFile(projectPath(root, 'src/controllers/AuthController.ts'), authController());
    writeFile(projectPath(root, 'src/routes/auth.ts'), authRoutes());
    writeFile(
      projectPath(root, 'database/migrations/20260101000000_create_users_table.ts'),
      usersTableMigration(),
    );
    writeFile(
      projectPath(root, 'database/migrations/20260101000001_create_sessions_table.ts'),
      sessionsTableMigration(),
    );
    writeFile(projectPath(root, 'src/main.ts'), mainEntryWithAuth());

    console.log('Auth scaffolding installed.');
    console.log('');
    console.log('Next steps:');
    console.log('  npm install @tyravel/auth  # if not already in package.json');
    console.log('  tyravel migrate');
    console.log('  POST /login with { "email", "password" }');
    console.log('  GET /me with session cookie (middleware: auth)');

    return 0;
  }
}