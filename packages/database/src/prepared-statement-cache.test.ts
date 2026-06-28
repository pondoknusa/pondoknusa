import { describe, expect, it } from 'vitest';
import { PreparedStatementCache } from './prepared-statement-cache.js';
import { SqliteConnection } from './sqlite-connection.js';

describe('PreparedStatementCache', () => {
  it('reuses cached statement factories', () => {
    const cache = new PreparedStatementCache<string>();
    let created = 0;

    const first = cache.get('SELECT 1', () => {
      created += 1;
      return 'stmt';
    });
    const second = cache.get('SELECT 1', () => {
      created += 1;
      return 'stmt-2';
    });

    expect(first).toBe('stmt');
    expect(second).toBe('stmt');
    expect(created).toBe(1);
  });
});

describe('SqliteConnection prepared statements', () => {
  it('caches prepared statements per connection', async () => {
    const connection = await SqliteConnection.connect(':memory:');
    await connection.exec('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)');

    await connection.query('SELECT * FROM items WHERE name = ?', ['a']);
    await connection.query('SELECT * FROM items WHERE name = ?', ['b']);

    const internal = connection as unknown as {
      statementCache: PreparedStatementCache<unknown>;
    };
    expect(internal.statementCache.size()).toBe(1);

    await connection.close();
  });
});