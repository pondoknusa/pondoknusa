import { registerSupabaseStorageDriver } from './register.js';

export class SupabaseStorageServiceProvider {
  constructor(_app: unknown) {}

  register(): void {
    registerSupabaseStorageDriver();
  }
}