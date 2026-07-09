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

describe('ModelQueryBuilder', () => {
  it('first() returns a Model instance with getAttribute', async () => {
    const connection = new SqliteConnection(':memory:');
    User.useConnection(connection);

    await connection.exec(`
      CREATE TABLE "users" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL
      )
    `);

    await User.create({ name: 'Ada Lovelace', email: 'ada@example.com' });

    const user = await User.query().where('email', 'ada@example.com').first();

    expect(user).toBeInstanceOf(User);
    expect(user?.getAttribute('email')).toBe('ada@example.com');
  });

  it('firstRaw() returns a plain row object', async () => {
    const connection = new SqliteConnection(':memory:');
    User.useConnection(connection);

    await connection.exec(`
      CREATE TABLE "users" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL
      )
    `);

    await User.create({ name: 'Grace Hopper', email: 'grace@example.com' });

    const row = await User.query().where('email', 'grace@example.com').firstRaw();

    expect(row).not.toBeNull();
    expect(row).not.toBeInstanceOf(User);
    expect(row).not.toHaveProperty('getAttribute');
    expect(row?.email).toBe('grace@example.com');
  });

  it('firstModel() still returns a Model instance', async () => {
    const connection = new SqliteConnection(':memory:');
    User.useConnection(connection);

    await connection.exec(`
      CREATE TABLE "users" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL
      )
    `);

    await User.create({ name: 'Alan Turing', email: 'alan@example.com' });

    const user = await User.query().where('email', 'alan@example.com').firstModel();

    expect(user).toBeInstanceOf(User);
    expect(user?.getAttribute('name')).toBe('Alan Turing');
  });
});
