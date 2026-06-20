import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { DatabaseConnection } from './connection.js';
import type { Migration } from './migration.js';
import { migrationsTableSql, SchemaBuilder } from './schema/schema-builder.js';

export class Migrator {
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly migrationsPath: string,
  ) {}

  async ensureMigrationsTable(): Promise<void> {
    await this.connection.exec(migrationsTableSql(this.connection.grammar));
  }

  async pending(): Promise<string[]> {
    await this.ensureMigrationsTable();
    const executed = await this.executed();
    return this.files().filter((file) => !executed.includes(file));
  }

  async run(): Promise<string[]> {
    await this.ensureMigrationsTable();
    const pending = await this.pending();
    if (pending.length === 0) {
      return [];
    }

    const batch = (await this.latestBatch()) + 1;
    const schema = new SchemaBuilder(this.connection);
    const ran: string[] = [];

    for (const file of pending) {
      const MigrationClass = await this.load(file);
      const migration = new MigrationClass();
      await migration.up(this.connection, schema);
      await this.record(file, batch);
      ran.push(file);
    }

    return ran;
  }

  private async executed(): Promise<string[]> {
    const grammar = this.connection.grammar;
    const result = await this.connection.query(
      `SELECT ${grammar.wrapIdentifier('migration')} FROM ${grammar.wrapIdentifier('migrations')} ORDER BY ${grammar.wrapIdentifier('id')} ASC`,
    );
    return result.rows.map((row) => String(row.migration));
  }

  private async latestBatch(): Promise<number> {
    const grammar = this.connection.grammar;
    const batchColumn = grammar.wrapIdentifier('batch');
    const result = await this.connection.query(
      `SELECT MAX(${batchColumn}) as ${batchColumn} FROM ${grammar.wrapIdentifier('migrations')}`,
    );
    const batch = result.rows[0]?.batch;
    return typeof batch === 'number' ? batch : 0;
  }

  private files(): string[] {
    try {
      return readdirSync(this.migrationsPath)
        .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
        .sort();
    } catch {
      return [];
    }
  }

  private async load(file: string): Promise<new () => Migration> {
    const moduleUrl = pathToFileURL(join(this.migrationsPath, file)).href;
    const loaded = await import(moduleUrl);
    const MigrationClass = loaded.default ?? Object.values(loaded).find(
      (value) => typeof value === 'function',
    );

    if (typeof MigrationClass !== 'function') {
      throw new Error(`Migration class not found in ${file}`);
    }

    return MigrationClass as new () => Migration;
  }

  private async record(migration: string, batch: number): Promise<void> {
    const grammar = this.connection.grammar;
    const table = grammar.wrapIdentifier('migrations');
    const sql = `INSERT INTO ${table} (${grammar.wrapIdentifier('migration')}, ${grammar.wrapIdentifier('batch')}, ${grammar.wrapIdentifier('executed_at')}) VALUES (${grammar.parameter(1)}, ${grammar.parameter(2)}, ${grammar.parameter(3)})`;
    await this.connection.query(sql, [migration, batch, new Date().toISOString()]);
  }
}