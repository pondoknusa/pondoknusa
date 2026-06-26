import { describe, expect, it } from 'vitest';
import { Model } from './model.js';
import { createGlobalScope } from './scopes.js';
import { SqliteConnection } from './sqlite-connection.js';

type PostRow = {
  id: number;
  title: string;
  published: number;
  deleted_at: number | null;
  [key: string]: unknown;
};

describe('global scopes', () => {
  it('can skip a named global scope', async () => {
    class Post extends Model<PostRow> {
      static override table = 'posts';
    }

    const connection = new SqliteConnection(':memory:');
    Post.useConnection(connection);
    Post.addGlobalScope(createGlobalScope('published-only', (builder) => builder.where('published', 1)));

    await connection.exec(`
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        published INTEGER NOT NULL DEFAULT 0,
        deleted_at INTEGER
      );
    `);

    await Post.create({ title: 'Draft', published: 0 });
    await Post.create({ title: 'Live', published: 1 });

    expect(await Post.all()).toHaveLength(1);
    expect(await Post.withoutGlobalScope('published-only').getModels()).toHaveLength(2);
  });

  it('registers soft deletes as a global scope', async () => {
    class Post extends Model<PostRow> {
      static override table = 'posts';
      static override softDeletes = true;
    }

    const connection = new SqliteConnection(':memory:');
    Post.useConnection(connection);

    await connection.exec(`
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        published INTEGER NOT NULL DEFAULT 1,
        deleted_at INTEGER
      );
    `);

    const post = await Post.create({ title: 'Draft', published: 1 });
    await post.softDelete();

    expect(await Post.all()).toHaveLength(0);
    expect(await Post.withoutGlobalScope('softDeleting').getModels()).toHaveLength(1);
  });
});