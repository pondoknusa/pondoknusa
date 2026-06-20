import { describe, expect, it } from 'vitest';
import { Model } from './model.js';
import { SqliteConnection } from './sqlite-connection.js';

type UserRow = {
  id: number;
  name: string;
  email: string;
  [key: string]: unknown;
};

class User extends Model<UserRow> {
  static override table = 'users';
}

describe('Model', () => {
  it('supports eloquent-style create, find, update, and delete', async () => {
    const connection = new SqliteConnection(':memory:');
    User.useConnection(connection);

    await connection.exec(`
      CREATE TABLE "users" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL
      )
    `);

    const user = await User.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });

    expect(user.getAttribute('name')).toBe('Ada Lovelace');

    const found = await User.find(user.getAttribute('id')!);
    expect(found?.getAttribute('email')).toBe('ada@example.com');

    await user.update({ name: 'Grace Hopper' });
    const fresh = await user.fresh();
    expect(fresh?.getAttribute('name')).toBe('Grace Hopper');

    await user.delete();
    expect(await User.find(user.getAttribute('id')!)).toBeNull();
  });
});