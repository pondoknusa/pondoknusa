import { beforeAll, describe, expect, it } from 'vitest';
import { Factory } from './factory.js';
import { Model } from './model.js';
import { SqliteConnection } from './sqlite-connection.js';

type UserRow = { id: number; name: string; [key: string]: unknown };
type PostRow = { id: number; user_id: number; title: string; [key: string]: unknown };

class User extends Model<UserRow> {
  static override table = 'users';
}

class Post extends Model<PostRow> {
  static override table = 'posts';
}

class UserFactory extends Factory<User, UserRow> {
  protected readonly ModelClass = User;
  definition(): Partial<UserRow> {
    return { name: 'Ada' };
  }
}

class PostFactory extends Factory<Post, PostRow> {
  protected readonly ModelClass = Post;
  definition(): Partial<PostRow> {
    return { title: 'Hello' };
  }
}

describe('Factory relationships', () => {
  const connection = new SqliteConnection(':memory:');

  beforeAll(async () => {
    User.useConnection(connection);
    Post.useConnection(connection);
    await connection.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
      CREATE TABLE posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL);
    `);
  });

  it('creates related models with has()', async () => {
    const user = (await new UserFactory()
      .has(new PostFactory(), 2, (parent) => ({ user_id: parent.getAttribute('id')! }))
      .create()) as User;

    const posts = await Post.query().where('user_id', user.getAttribute('id')!).get();
    expect(posts).toHaveLength(2);
  });
});