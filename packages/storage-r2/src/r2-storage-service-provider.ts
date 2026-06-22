import { registerR2StorageDriver } from './register.js';

export class R2StorageServiceProvider {
  constructor(_app: unknown) {}

  register(): void {
    registerR2StorageDriver();
  }
}