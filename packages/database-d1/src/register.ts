import { DatabaseManager, type ConnectionConfig } from '@pondoknusa/database';
import { D1Connection } from './d1-connection.js';
import type { D1ConnectionConfig } from './types.js';

export function registerD1DatabaseDriver(): void {
  DatabaseManager.extend(
    'd1',
    (config: ConnectionConfig) =>
      new D1Connection(config as unknown as D1ConnectionConfig),
  );
}
