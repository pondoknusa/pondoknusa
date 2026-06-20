import { beforeAll, describe, expect, it } from 'vitest';
import type { BelongsToRelation } from './relations/belongs-to.js';
import type { BelongsToManyRelation } from './relations/belongs-to-many.js';
import type { HasManyRelation } from './relations/has-many.js';
import type { HasOneRelation } from './relations/has-one.js';
import { Model } from './model.js';
import { SqliteConnection } from './sqlite-connection.js';

type UserRow = {
  id: number;
  name: string;
  [key: string]: unknown;
};

type PostRow = {
  id: number;
  user_id: number;
  title: string;
  [key: string]: unknown;
};

type RoleRow = {
  id: number;
  name: string;
  [key: string]: unknown;
};

class User extends Model<UserRow> {
  static override table = 'users';

  posts(): HasManyRelation<Post> {
    return this.hasMany(Post);
  }

  latestPost(): HasOneRelation<Post> {
    return this.hasOne(Post);
  }

  roles(): BelongsToManyRelation<Role> {
    return this.belongsToMany(Role);
  }
}

class Post extends Model<PostRow> {
  static override table = 'posts';

  user(): BelongsToRelation<User> {
    return this.belongsTo(User);
  }
}

class Role extends Model<RoleRow> {
  static override table = 'roles';
}

function trackQueries(connection: SqliteConnection): { count: () => number } {
  let queryCount = 0;
  const originalQuery = connection.query.bind(connection);
  connection.query = async (sql, bindings) => {
    queryCount++;
    return originalQuery(sql, bindings);
  };

  return {
    count: () => queryCount,
  };
}

describe('eager loading', () => {
  const connection = new SqliteConnection(':memory:');

  beforeAll(async () => {
    User.useConnection(connection);
    Post.useConnection(connection);
    Role.useConnection(connection);

    await connection.exec(`
      CREATE TABLE "users" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL
      );
      CREATE TABLE "posts" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "user_id" INTEGER NOT NULL,
        "title" TEXT NOT NULL
      );
      CREATE TABLE "roles" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL
      );
      CREATE TABLE "user_role" (
        "user_id" INTEGER NOT NULL,
        "role_id" INTEGER NOT NULL
      );
    `);
  });

  it('eager loads hasMany relations without N+1 queries', async () => {
    const ada = await User.create({ name: 'Ada' });
    const grace = await User.create({ name: 'Grace' });
    await Post.create({ user_id: ada.getAttribute('id')!, title: 'Ada 1' });
    await Post.create({ user_id: ada.getAttribute('id')!, title: 'Ada 2' });
    await Post.create({ user_id: grace.getAttribute('id')!, title: 'Grace 1' });

    const tracker = trackQueries(connection);
    const users = await User.query()
      .whereIn('id', [ada.getAttribute('id')!, grace.getAttribute('id')!])
      .with('posts')
      .getModels();

    expect(tracker.count()).toBe(2);
    expect(users).toHaveLength(2);
    expect(users.every((user) => user.relationLoaded('posts'))).toBe(true);

    const adaPosts = users
      .find((user) => user.getAttribute('name') === 'Ada')
      ?.getRelation<Post[]>('posts');
    const gracePosts = users
      .find((user) => user.getAttribute('name') === 'Grace')
      ?.getRelation<Post[]>('posts');

    expect(adaPosts).toHaveLength(2);
    expect(gracePosts).toHaveLength(1);
    expect(adaPosts?.map((post) => post.getAttribute('title')).sort()).toEqual([
      'Ada 1',
      'Ada 2',
    ]);
  });

  it('eager loads hasOne relations', async () => {
    const user = await User.create({ name: 'Katherine' });
    await Post.create({ user_id: user.getAttribute('id')!, title: 'Only' });

    const tracker = trackQueries(connection);
    const loaded = await User.query()
      .where('id', user.getAttribute('id')!)
      .with('latestPost')
      .firstModel();

    expect(tracker.count()).toBe(2);
    expect(loaded?.relationLoaded('latestPost')).toBe(true);
    expect(loaded?.getRelation<Post>('latestPost')?.getAttribute('title')).toBe(
      'Only',
    );
  });

  it('eager loads belongsTo relations', async () => {
    const ada = await User.create({ name: 'Ada' });
    const grace = await User.create({ name: 'Grace' });
    const adaPost = await Post.create({
      user_id: ada.getAttribute('id')!,
      title: 'Ada eager post',
    });
    const gracePost = await Post.create({
      user_id: grace.getAttribute('id')!,
      title: 'Grace eager post',
    });

    const tracker = trackQueries(connection);
    const posts = await Post.query()
      .whereIn('id', [adaPost.getAttribute('id')!, gracePost.getAttribute('id')!])
      .with('user')
      .getModels();

    expect(tracker.count()).toBe(2);
    expect(posts).toHaveLength(2);
    expect(posts.every((post) => post.relationLoaded('user'))).toBe(true);
    expect(
      posts
        .map((post) => post.getRelation<User>('user')?.getAttribute('name'))
        .sort(),
    ).toEqual(['Ada', 'Grace']);
  });

  it('eager loads belongsToMany relations', async () => {
    const user = await User.create({ name: 'Alan' });
    const admin = await Role.create({ name: 'admin' });
    const editor = await Role.create({ name: 'editor' });

    await connection.query(
      'INSERT INTO "user_role" ("user_id", "role_id") VALUES (?, ?), (?, ?)',
      [
        user.getAttribute('id')!,
        admin.getAttribute('id')!,
        user.getAttribute('id')!,
        editor.getAttribute('id')!,
      ],
    );

    const tracker = trackQueries(connection);
    const users = await User.query()
      .where('id', user.getAttribute('id')!)
      .with('roles')
      .getModels();

    expect(tracker.count()).toBe(2);
    expect(users[0]?.relationLoaded('roles')).toBe(true);
    expect(users[0]?.getRelation<Role[]>('roles')?.map((role) => role.getAttribute('name')).sort()).toEqual([
      'admin',
      'editor',
    ]);
  });

  it('throws when eager loading an undefined relation', async () => {
    await expect(User.with('missing').getModels()).rejects.toThrow(
      'Relation [missing] not defined on model [User].',
    );
  });
});