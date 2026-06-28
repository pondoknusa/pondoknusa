import { describe, expect, it } from 'vitest';
import { Model } from './model.js';
import { SqliteConnection } from './sqlite-connection.js';

class Tag extends Model {
  static override table = 'tags';
}

describe('Model.insertMany', () => {
  it('inserts multiple rows in one statement', async () => {
    const connection = new SqliteConnection(':memory:');
    Tag.useConnection(connection);

    await connection.exec(`
      CREATE TABLE tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    const inserted = await Tag.insertMany([
      { name: 'news' },
      { name: 'featured' },
      { name: 'archived' },
    ]);

    expect(inserted).toBe(3);
    const rows = await Tag.all();
    expect(rows).toHaveLength(3);
    await connection.close();
  });
});