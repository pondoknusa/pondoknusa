import type { Application } from '@tyravel/core';
import type { DatabaseConnection, DatabaseManager } from '@tyravel/database';

export async function beginDatabaseTransaction(app: Application): Promise<DatabaseConnection> {
  const manager = app.make<DatabaseManager>('db');
  const connection = manager.connection();
  await connection.exec('BEGIN');
  return connection;
}

export async function rollbackDatabaseTransaction(connection: DatabaseConnection): Promise<void> {
  await connection.exec('ROLLBACK');
}