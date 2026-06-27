import { afterEach, describe, expect, it } from 'vitest';
import { LazyLoadingViolationError } from './lazy-loading.js';
import { Model } from './model.js';
import type { HasManyRelation } from './relations/has-many.js';
import { SqliteConnection } from './sqlite-connection.js';

type PostRow = {
  id: number;
  title: string;
  user_id: number;
  [key: string]: unknown;
};

type UserRow = {
  id: number;
  name: string;
  [key: string]: unknown;
};

class Post extends Model<PostRow> {
  static override table = 'posts';
}

class User extends Model<UserRow> {
  static override table = 'users';

  posts(): HasManyRelation<Post> {
    return this.relation('posts', () => this.hasMany(Post));
  }
}

describe('lazy loading prevention', () => {
  afterEach(() => {
    Model.preventLazyLoading(false);
  });

  it('throws when lazy loading is disabled and the relation is named', async () => {
    const connection = new SqliteConnection(':memory:');
    User.useConnection(connection);
    Post.useConnection(connection);

    await connection.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        user_id INTEGER NOT NULL
      );
    `);

    const user = await User.create({ name: 'Ada' });
    Model.preventLazyLoading(true);

    await expect(user.posts().get()).rejects.toThrow(LazyLoadingViolationError);
  });

  it('allows eager-loaded relations when lazy loading is disabled', async () => {
    const connection = new SqliteConnection(':memory:');
    User.useConnection(connection);
    Post.useConnection(connection);

    await connection.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        user_id INTEGER NOT NULL
      );
    `);

    const user = await User.create({ name: 'Ada' });
    await Post.create({ title: 'Hello', user_id: user.getAttribute('id')! });

    const loaded = (await User.with('posts').getModels<User>())[0]!;
    Model.preventLazyLoading(true);

    const posts = await loaded.posts().get();
    expect(posts).toHaveLength(1);
  });
});