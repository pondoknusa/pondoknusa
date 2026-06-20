import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fakeEmail, fakeName, resetFactoryHelpers } from './factory-helpers.js';
import { Factory } from './factory.js';
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

class UserFactory extends Factory<User, UserRow> {
  protected readonly ModelClass = User;

  definition(): Partial<UserRow> {
    return {
      name: fakeName(),
      email: fakeEmail(),
    };
  }
}

describe('Factory', () => {
  const connection = new SqliteConnection(':memory:');
  const userFactory = new UserFactory();

  afterEach(() => {
    resetFactoryHelpers();
  });

  beforeAll(async () => {
    User.useConnection(connection);
    await connection.exec(`
      CREATE TABLE "users" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL
      );
    `);
  });

  it('makes unsaved model instances', () => {
    const user = userFactory.make({ name: 'Ada' });
    expect(user.getAttribute('name')).toBe('Ada');
    expect(user.getAttribute('id')).toBeUndefined();
  });

  it('creates persisted models', async () => {
    const user = (await userFactory.create()) as User;
    expect(user.getAttribute('id')).toBeDefined();
    expect(user.getAttribute('email')).toContain('@example.com');

    const found = await User.find(user.getAttribute('id')!);
    expect(found?.getAttribute('name')).toBe(user.getAttribute('name'));
  });

  it('creates multiple models with count()', async () => {
    const users = (await userFactory.count(3).create()) as User[];
    expect(users).toHaveLength(3);

    const emails = users.map((user) => user.getAttribute('email'));
    expect(new Set(emails).size).toBe(3);
  });
});