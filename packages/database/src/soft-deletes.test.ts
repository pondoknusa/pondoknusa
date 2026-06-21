import { describe, expect, it } from 'vitest';
import { DatabaseManager } from './database-manager.js';
import { Model } from './model.js';
import { QueryBuilder } from './query-builder.js';
import type { DatabaseConfig } from './types.js';

class Post extends Model<{ id: number; title: string; deleted_at: number | null }> {
  static override table = 'posts';
  static override softDeletes = true;
}

describe('soft deletes', () => {
  const config: DatabaseConfig = {
    default: 'sqlite',
    connections: {
      sqlite: { driver: 'sqlite', database: ':memory:' },
    },
  };

  async function setup() {
    const manager = new DatabaseManager(config);
    const connection = manager.connection();
    await connection.exec(`
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        deleted_at INTEGER
      );
    `);
    await new QueryBuilder(connection, 'posts').insert({ title: 'Draft' });
    Model.setConnectionResolver(() => connection);
    return connection;
  }

  it('excludes soft deleted rows by default', async () => {
    await setup();
    const post = await Post.find(1);
    await post?.softDelete();

    expect(await Post.all()).toHaveLength(0);
    expect(await Post.withTrashed().getModels()).toHaveLength(1);
    expect(await Post.onlyTrashed().getModels()).toHaveLength(1);
  });

  it('restores soft deleted rows', async () => {
    await setup();
    const post = await Post.find(1);
    await post?.softDelete();
    await post?.restore();

    expect(await Post.all()).toHaveLength(1);
  });

  it('force deletes rows permanently', async () => {
    await setup();
    const post = await Post.find(1);
    await post?.forceDelete();

    expect(await Post.withTrashed().getModels()).toHaveLength(0);
  });
});