import type { DatabaseConnection } from '../connection.js';
import { Blueprint } from './blueprint.js';

export class SchemaBuilder {
  constructor(private readonly connection: DatabaseConnection) {}

  async create(
    tableName: string,
    callback: (table: Blueprint) => void,
  ): Promise<void> {
    const blueprint = new Blueprint(tableName);
    callback(blueprint);
    await this.connection.exec(blueprint.toCreateSql());
  }

  async drop(tableName: string): Promise<void> {
    const blueprint = new Blueprint(tableName);
    await this.connection.exec(blueprint.toDropSql());
  }

  async hasTable(tableName: string): Promise<boolean> {
    const result = await this.connection.query(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
      [tableName],
    );
    return result.rows.length > 0;
  }
}