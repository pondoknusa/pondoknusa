import type { DatabaseConnection } from './connection.js';
import { runWithConnection } from './connection-context.js';
import { MysqlConnection } from './mysql-connection.js';
import { PostgresConnection } from './postgres-connection.js';
import { SqliteConnection } from './sqlite-connection.js';
import type { ConnectionConfig, DatabaseConfig } from './types.js';

export class DatabaseManager {
  private readonly connections = new Map<string, DatabaseConnection>();

  constructor(
    private readonly config: DatabaseConfig,
    private readonly basePath = process.cwd(),
  ) {}

  connection(name?: string): DatabaseConnection {
    const connectionName = name ?? this.config.default;
    const existing = this.connections.get(connectionName);
    if (existing) {
      return existing;
    }

    const connectionConfig = this.config.connections[connectionName];
    if (!connectionConfig) {
      throw new Error(`Database connection not configured: ${connectionName}`);
    }

    const connection = this.createConnection(connectionConfig);
    this.connections.set(connectionName, connection);
    return connection;
  }

  async transaction<T>(
    callback: () => Promise<T>,
    name?: string,
  ): Promise<T> {
    const connection = this.connection(name);
    return connection.transaction(async (transactional) =>
      runWithConnection(transactional, callback),
    );
  }

  async close(name?: string): Promise<void> {
    if (name) {
      const connection = this.connections.get(name);
      await connection?.close?.();
      this.connections.delete(name);
      return;
    }

    await Promise.all(
      [...this.connections.values()].map((connection) => connection.close?.()),
    );
    this.connections.clear();
  }

  private createConnection(config: ConnectionConfig): DatabaseConnection {
    switch (config.driver) {
      case 'sqlite':
        return new SqliteConnection(config.database, this.basePath);
      case 'postgres':
        return new PostgresConnection(config);
      case 'mysql':
        return new MysqlConnection(config);
      default:
        throw new Error(`Unsupported database driver: ${(config as ConnectionConfig).driver}`);
    }
  }
}