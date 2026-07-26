import { describe, expect, it } from 'vitest';
import {
  MssqlGrammar,
  MysqlGrammar,
  OracleGrammar,
  PostgresGrammar,
  SqliteGrammar,
} from './grammar.js';
import { QueryBuilder } from './query-builder.js';
import type { DatabaseConnection } from './connection.js';
import type { QueryResult } from './connection.js';
import type { SqlGrammar } from './grammar.js';

function mockConnection(grammar: SqlGrammar): DatabaseConnection {
  return {
    grammar,
    async query(): Promise<QueryResult> {
      return { rows: [], changes: 0 };
    },
    async exec(): Promise<void> {},
    async transaction<T>(callback: (connection: DatabaseConnection) => Promise<T>) {
      return callback(mockConnection(grammar));
    },
  };
}

describe('SqlGrammar', () => {
  it('uses dialect-specific placeholders and identifier quoting', () => {
    const cases = [
      {
        grammar: new SqliteGrammar(),
        sql: 'SELECT * FROM "users" WHERE "id" = ? LIMIT ?',
        bindings: [1, 10],
      },
      {
        grammar: new PostgresGrammar(),
        sql: 'SELECT * FROM "users" WHERE "id" = $1 LIMIT $2',
        bindings: [1, 10],
      },
      {
        grammar: new MysqlGrammar(),
        sql: 'SELECT * FROM `users` WHERE `id` = ? LIMIT ?',
        bindings: [1, 10],
      },
      {
        grammar: new OracleGrammar(),
        sql: 'SELECT * FROM "users" WHERE "id" = :1 OFFSET :2 ROWS FETCH NEXT :3 ROWS ONLY',
        bindings: [1, 0, 10],
      },
      {
        grammar: new MssqlGrammar(),
        sql: 'SELECT * FROM [users] WHERE [id] = @p1 ORDER BY (SELECT NULL) OFFSET @p2 ROWS FETCH NEXT @p3 ROWS ONLY',
        bindings: [1, 0, 10],
      },
    ];

    for (const { grammar, sql, bindings } of cases) {
      const builder = new QueryBuilder(mockConnection(grammar), 'users')
        .where('id', 1)
        .limit(10);

      expect(builder.toSql()).toEqual({
        sql,
        bindings,
      });
    }
  });

  it('flags postgres as supporting RETURNING', () => {
    expect(new PostgresGrammar().supportsReturning).toBe(true);
    expect(new SqliteGrammar().supportsReturning).toBe(false);
    expect(new MysqlGrammar().supportsReturning).toBe(false);
    expect(new OracleGrammar().supportsReturning).toBe(false);
    expect(new MssqlGrammar().supportsReturning).toBe(false);
  });
});
