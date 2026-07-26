import { DatabaseManager, type ConnectionConfig } from '@pondoknusa/database';
import { OracleConnection } from './oracle-connection.js';
import type { OracleConnectionConfig } from './types.js';

export function registerOracleDatabaseDriver(): void {
  DatabaseManager.extend(
    'oracle',
    (config: ConnectionConfig) =>
      new OracleConnection(config as unknown as OracleConnectionConfig),
  );
}
