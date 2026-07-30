import { describe, expect, it } from 'vitest';
import type { DatabaseConnection, QueryResult } from '@pondoknusa/database';
import { SqliteConnection } from '@pondoknusa/database';
import { DatabaseSessionStore } from './session-store.js';

const SESSIONS_DDL = `
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL,
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT
  )
`;

async function openSessionsDb(): Promise<SqliteConnection> {
  const connection = await SqliteConnection.connect(':memory:');
  await connection.exec(SESSIONS_DDL);
  return connection;
}

describe('DatabaseSessionStore', () => {
  it('upserts concurrent first-writes without UNIQUE failures', async () => {
    const connection = await openSessionsDb();
    const store = new DatabaseSessionStore(connection);

    await Promise.all([
      store.write('sess-race', { _csrf_token: 'a', n: 1 }, 120),
      store.write('sess-race', { _csrf_token: 'b', n: 2 }, 120),
      store.write('sess-race', { _csrf_token: 'c', n: 3 }, 120),
    ]);

    const data = await store.read('sess-race');
    expect(data._csrf_token).toBeDefined();
    expect([1, 2, 3]).toContain(data.n);

    const count = await connection.query('SELECT COUNT(*) AS c FROM sessions WHERE id = ?', [
      'sess-race',
    ]);
    expect(Number(count.rows[0]?.c)).toBe(1);

    await connection.close();
  });

  it('retries read when the row becomes visible after write', async () => {
    const inner = await openSessionsDb();
    let selectMisses = 0;
    const lagging: DatabaseConnection = {
      grammar: inner.grammar,
      query: async (sql, bindings = []): Promise<QueryResult> => {
        const result = await inner.query(sql, bindings);
        const isSelect =
          sql.trimStart().toLowerCase().startsWith('select') &&
          sql.toLowerCase().includes('sessions');
        if (isSelect && result.rows.length > 0 && selectMisses < 2) {
          selectMisses += 1;
          return { rows: [], changes: 0 };
        }
        return result;
      },
      exec: (sql) => inner.exec(sql),
      transaction: (cb) => inner.transaction(cb),
      close: () => inner.close(),
    };

    const store = new DatabaseSessionStore(lagging);
    await store.write('sess-lag', { _csrf_token: 'csrf-1', step: 'get' }, 120);

    const data = await store.read('sess-lag');
    expect(data).toEqual({ _csrf_token: 'csrf-1', step: 'get' });
    expect(selectMisses).toBe(2);

    await inner.close();
  });

  it('update-first write refreshes an existing row', async () => {
    const connection = await openSessionsDb();
    const store = new DatabaseSessionStore(connection);

    await store.write('sess-1', { v: 1 }, 120);
    await store.write('sess-1', { v: 2 }, 120);

    expect(await store.read('sess-1')).toEqual({ v: 2 });
    await connection.close();
  });
});
