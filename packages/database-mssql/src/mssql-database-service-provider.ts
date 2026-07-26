import { registerMssqlDatabaseDriver } from './register.js';

export class MssqlDatabaseServiceProvider {
  constructor(_app: unknown) {}

  register(): void {
    registerMssqlDatabaseDriver();
  }
}
