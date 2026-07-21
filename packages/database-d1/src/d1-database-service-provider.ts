import { registerD1DatabaseDriver } from './register.js';

export class D1DatabaseServiceProvider {
  constructor(_app: unknown) {}

  register(): void {
    registerD1DatabaseDriver();
  }
}
