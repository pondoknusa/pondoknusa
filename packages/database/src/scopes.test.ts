import { describe, expect, it } from 'vitest';
import { Model } from './model.js';
import type { ModelQueryBuilder } from './model-query-builder.js';
import { SqliteConnection } from './sqlite-connection.js';

type PostRow = {
  id: number;
  title: string;
  published: number;
  [key: string]: unknown;
};

describe('query scopes', () => {
  it('applies local scopes via Model.scope()', async () => {
    class Post extends Model<PostRow> {
      static override table = 'posts';

      static scopePublished(builder: ModelQueryBuilder): ModelQueryBuilder {
        return builder.where('published', 1);
      }
    }

    const connection = new SqliteConnection(':memory:');
    Post.useConnection(connection);

    await connection.exec(`
      CREATE TABLE "posts" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "title" TEXT NOT NULL,
        "published" INTEGER NOT NULL DEFAULT 0
      )
    `);

    await Post.create({ title: 'Draft', published: 0 });
    await Post.create({ title: 'Live', published: 1 });

    const published = await Post.scope('published').getModels<Post>();
    expect(published).toHaveLength(1);
    expect(published[0]?.getAttribute('title')).toBe('Live');
  });

  it('applies global scopes on every query', async () => {
    class Post extends Model<PostRow> {
      static override table = 'posts';
    }

    const connection = new SqliteConnection(':memory:');
    Post.useConnection(connection);
    Post.addGlobalScope((builder) => builder.where('published', 1));

    await connection.exec(`
      CREATE TABLE "posts" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "title" TEXT NOT NULL,
        "published" INTEGER NOT NULL DEFAULT 0
      )
    `);

    await Post.create({ title: 'Draft', published: 0 });
    await Post.create({ title: 'Live', published: 1 });

    const posts = await Post.all<Post>();
    expect(posts).toHaveLength(1);
    expect(posts[0]?.getAttribute('title')).toBe('Live');
  });
});