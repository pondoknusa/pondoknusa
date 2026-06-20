import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import type { DatabaseConnection, QueryResult } from './connection.js';
import { SqliteGrammar, type SqlGrammar } from './grammar.js';
import type { RowValue } from './types.js';

interface SqliteStatement {
  all(...params: RowValue[]): unknown[];
  get(...params: RowValue[]): unknown;
  run(...params: RowValue[]): { changes: number; lastInsertRowid: number | bigint };
}

interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

type SqliteModule = {
  DatabaseSync: new (path: string) => SqliteDatabase;
};

export class SqliteConnection implements DatabaseConnection {
  readonly grammar: SqlGrammar = new SqliteGrammar();
  private readonly database: SqliteDatabase;

  constructor(databasePath: string, basePath = process.cwd()) {
    const resolvedPath = databasePath === ':memory:'
      ? ':memory:'
      : resolve(basePath, databasePath);

    if (resolvedPath !== ':memory:') {
      mkdirSync(dirname(resolvedPath), { recursive: true });
    }

    const sqlite = loadSqliteModule();
    this.database = new sqlite.DatabaseSync(resolvedPath);
  }

  async query(sql: string, bindings: RowValue[] = []): Promise<QueryResult> {
    const statement = this.database.prepare(sql);
    const trimmed = sql.trim().toLowerCase();

    if (trimmed.startsWith('select') || trimmed.startsWith('pragma')) {
      const rows = statement.all(...normalizeBindings(bindings)) as Record<string, unknown>[];
      return { rows, changes: 0 };
    }

    const result = statement.run(...normalizeBindings(bindings));
    return {
      rows: [],
      changes: result.changes,
      lastInsertId: result.lastInsertRowid,
    };
  }

  async exec(sql: string): Promise<void> {
    this.database.exec(sql);
  }

  async transaction<T>(
    callback: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    await this.exec('BEGIN');
    try {
      const result = await callback(this);
      await this.exec('COMMIT');
      return result;
    } catch (error) {
      await this.exec('ROLLBACK');
      throw error;
    }
  }
}

const require = createRequire(import.meta.url);

function loadSqliteModule(): SqliteModule {
  try {
    return require('node:sqlite') as SqliteModule;
  } catch {
    throw new Error(
      'SQLite support requires Node.js 22.5+ with the built-in node:sqlite module.',
    );
  }
}

function normalizeBindings(bindings: RowValue[]): RowValue[] {
  return bindings.map((binding) => (binding === undefined ? null : binding));
}