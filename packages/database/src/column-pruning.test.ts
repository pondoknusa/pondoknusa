import { describe, expect, it } from 'vitest';
import { Model } from './model.js';
import { SqliteConnection } from './sqlite-connection.js';

class WidePost extends Model {
  static override table = 'wide_posts';
}

describe('Model.select column pruning', () => {
  it('hydrates only selected columns', async () => {
    const connection = new SqliteConnection(':memory:');
    WidePost.useConnection(connection);

    await connection.exec(`
      CREATE TABLE wide_posts (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        metadata TEXT NOT NULL
      )
    `);

    await WidePost.create({
      title: 'Hello',
      body: 'Body copy',
      metadata: '{"tags":["news"]}',
    });

    const pruned = await WidePost.select('id', 'title').getModels();
    expect(pruned[0]?.getAttribute('title')).toBe('Hello');
    expect(pruned[0]?.getAttribute('body')).toBeUndefined();
    expect(pruned[0]?.getAttribute('metadata')).toBeUndefined();

    const sql = WidePost.select('id', 'title').toSql();
    expect(sql.sql).toContain('"title"');
    expect(sql.sql).not.toContain('"body"');

    await connection.close();
  });
});