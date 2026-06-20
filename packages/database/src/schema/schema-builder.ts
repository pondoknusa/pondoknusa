import type { DatabaseConnection } from '../connection.js';
import type { SqlGrammar } from '../grammar.js';
import { Blueprint } from './blueprint.js';

export class SchemaBuilder {
  constructor(private readonly connection: DatabaseConnection) {}

  async create(
    tableName: string,
    callback: (table: Blueprint) => void,
  ): Promise<void> {
    const blueprint = new Blueprint(tableName, this.connection.grammar);
    callback(blueprint);
    await this.connection.exec(blueprint.toCreateSql());
  }

  async drop(tableName: string): Promise<void> {
    const blueprint = new Blueprint(tableName, this.connection.grammar);
    await this.connection.exec(blueprint.toDropSql());
  }

  async hasTable(tableName: string): Promise<boolean> {
    const { sql, bindings } = hasTableQuery(this.connection.grammar, tableName);
    const result = await this.connection.query(sql, bindings);
    return result.rows.length > 0;
  }
}

export function migrationsTableSql(grammar: SqlGrammar): string {
  const table = grammar.wrapIdentifier('migrations');
  const id = grammar.wrapIdentifier('id');
  const migration = grammar.wrapIdentifier('migration');
  const batch = grammar.wrapIdentifier('batch');
  const executedAt = grammar.wrapIdentifier('executed_at');

  switch (grammar.driver) {
    case 'postgres':
      return `CREATE TABLE IF NOT EXISTS ${table} (
        ${id} BIGSERIAL PRIMARY KEY,
        ${migration} VARCHAR(255) NOT NULL,
        ${batch} INTEGER NOT NULL,
        ${executedAt} TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
      )`;
    case 'mysql':
      return `CREATE TABLE IF NOT EXISTS ${table} (
        ${id} BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        ${migration} VARCHAR(255) NOT NULL,
        ${batch} INT NOT NULL,
        ${executedAt} TIMESTAMP NOT NULL
      )`;
    default:
      return `CREATE TABLE IF NOT EXISTS ${table} (
        ${id} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${migration} TEXT NOT NULL,
        ${batch} INTEGER NOT NULL,
        ${executedAt} TEXT NOT NULL
      )`;
  }
}

function hasTableQuery(
  grammar: SqlGrammar,
  tableName: string,
): { sql: string; bindings: string[] } {
  switch (grammar.driver) {
    case 'postgres':
      return {
        sql: `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = ${grammar.parameter(1)}`,
        bindings: [tableName],
      };
    case 'mysql':
      return {
        sql: `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${grammar.parameter(1)}`,
        bindings: [tableName],
      };
    default:
      return {
        sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${grammar.parameter(1)}`,
        bindings: [tableName],
      };
  }
}