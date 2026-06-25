import type { Application } from '@tyravel/core';
import type { ServiceProvider } from '@tyravel/core';
import type { DatabaseConnection } from '@tyravel/database';
import { createHttpKernel, wireFacades } from './application-helpers.js';
import { beginDatabaseTransaction, rollbackDatabaseTransaction } from './database-transactions.js';
import { HttpTestClient } from './http-test-client.js';

type ProviderConstructor = new (app: Application) => ServiceProvider;

export abstract class TestCase {
  public app!: Application;
  public kernel!: import('@tyravel/core').HttpKernel;
  public http!: HttpTestClient;

  /** Roll back database changes after each test when enabled. */
  protected usesDatabaseTransactions = false;

  private databaseConnection?: DatabaseConnection;

  /**
   * Build a fresh application instance (not booted).
   */
  protected abstract createApplication(): Application | Promise<Application>;

  /**
   * Optional service providers to register before boot.
   */
  protected providers(): ProviderConstructor[] {
    return [];
  }

  /**
   * Override to load routes, config, etc. after providers register, before boot.
   */
  protected async configureApplication(_app: Application): Promise<void> {}

  async setUp(): Promise<void> {
    this.app = await this.createApplication();
    for (const Provider of this.providers()) {
      this.app.register(Provider);
    }
    await this.configureApplication(this.app);
    await this.app.boot();
    wireFacades(this.app);
    if (this.usesDatabaseTransactions) {
      this.databaseConnection = await beginDatabaseTransaction(this.app);
    }
    this.kernel = createHttpKernel(this.app);
    this.http = new HttpTestClient(this.kernel);
  }

  async tearDown(): Promise<void> {
    if (this.databaseConnection) {
      await rollbackDatabaseTransaction(this.databaseConnection);
      this.databaseConnection = undefined;
    }
    this.app?.flush();
    this.http?.resetCookies();
  }

  /**
   * Reboot the application (fresh container, same class config).
   */
  async refreshApplication(): Promise<void> {
    await this.tearDown();
    await this.setUp();
  }
}