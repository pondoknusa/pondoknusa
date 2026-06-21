import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseConnection } from './connection.js';

const storage = new AsyncLocalStorage<DatabaseConnection>();

export function getContextConnection(): DatabaseConnection | undefined {
  return storage.getStore();
}

export function runWithConnection<T>(
  connection: DatabaseConnection,
  callback: () => Promise<T>,
): Promise<T> {
  return storage.run(connection, callback);
}