import { beforeAll, describe, expect, it } from 'vitest';
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
}

class Post extends Model<PostRow> {
  static override table = 'posts';
}

class Role extends Model<RoleRow> {
  static override table = 'roles';
}

describe('relationships', () => {
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

  it('loads hasMany related models', async () => {
    const user = await User.create({ name: 'Ada' });
    await Post.create({ user_id: user.getAttribute('id')!, title: 'First' });
    await Post.create({ user_id: user.getAttribute('id')!, title: 'Second' });

    const posts = await user.hasMany(Post).get();
    expect(posts).toHaveLength(2);
    expect(posts.map((post) => post.getAttribute('title'))).toEqual([
      'First',
      'Second',
    ]);
  });

  it('loads hasOne related model', async () => {
    const user = await User.create({ name: 'Grace' });
    await Post.create({ user_id: user.getAttribute('id')!, title: 'Only' });

    const post = await user.hasOne(Post).get();
    expect(post?.getAttribute('title')).toBe('Only');
  });

  it('loads belongsTo parent model', async () => {
    const user = await User.create({ name: 'Katherine' });
    const post = await Post.create({
      user_id: user.getAttribute('id')!,
      title: 'Hello',
    });

    const owner = await post.belongsTo(User).get();
    expect(owner?.getAttribute('name')).toBe('Katherine');
  });

  it('loads belongsToMany related models through pivot table', async () => {
    const user = await User.create({ name: 'Alan' });
    const admin = await Role.create({ name: 'admin' });
    const editor = await Role.create({ name: 'editor' });

    await connection.query(
      'INSERT INTO "user_role" ("user_id", "role_id") VALUES (?, ?), (?, ?)',
      [user.getAttribute('id')!, admin.getAttribute('id')!, user.getAttribute('id')!, editor.getAttribute('id')!],
    );

    const roles = await user.belongsToMany(Role).get();
    expect(roles).toHaveLength(2);
    expect(roles.map((role) => role.getAttribute('name')).sort()).toEqual([
      'admin',
      'editor',
    ]);
  });
});