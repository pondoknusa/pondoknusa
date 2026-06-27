import { describe, expect, it } from 'vitest';
import { HasUlids } from './concerns/has-ulids.js';
import { Model } from './model.js';
import { SqliteConnection } from './sqlite-connection.js';

type SessionRow = {
  id: string;
  token: string;
  [key: string]: unknown;
};

class Session extends HasUlids<SessionRow> {
  static override table = 'app_sessions';
}

describe('HasUlids', () => {
  it('assigns a 26-character ULID primary key on create', async () => {
    const connection = new SqliteConnection(':memory:');
    Session.useConnection(connection);

    await connection.exec(`
      CREATE TABLE app_sessions (
        id TEXT NOT NULL PRIMARY KEY,
        token TEXT NOT NULL
      );
    `);

    const session = await Session.create({ token: 'abc' });
    const id = session.getAttribute('id');

    expect(id).toHaveLength(26);
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);

    const found = await Session.find(id!);
    expect(found?.getAttribute('token')).toBe('abc');
  });
});