import { registerOracleDatabaseDriver } from './register.js';

export class OracleDatabaseServiceProvider {
  constructor(_app: unknown) {}

  register(): void {
    registerOracleDatabaseDriver();
  }
}
