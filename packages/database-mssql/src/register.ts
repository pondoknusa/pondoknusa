import { DatabaseManager, type ConnectionConfig } from '@pondoknusa/database';
import { MssqlConnection } from './mssql-connection.js';
import type { MssqlConnectionConfig } from './types.js';

export function registerMssqlDatabaseDriver(): void {
  DatabaseManager.extend(
    'mssql',
    (config: ConnectionConfig) =>
      new MssqlConnection(config as unknown as MssqlConnectionConfig),
  );
}
