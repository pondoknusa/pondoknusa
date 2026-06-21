import { describe, expect, it } from 'vitest';
import { Model } from './model.js';
import { QueryBuilder } from './query-builder.js';
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

async function seedUsers(connection: SqliteConnection): Promise<void> {
  await connection.exec(`
    CREATE TABLE "users" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL
    )
  `);

  const builder = new QueryBuilder<UserRow>(connection, 'users');
  for (let index = 1; index <= 12; index += 1) {
    await builder.insert({
      name: `User ${index}`,
      email: `user${index}@example.com`,
    });
  }
}

describe('Pagination', () => {
  it('paginates query builder results with total counts', async () => {
    const connection = new SqliteConnection(':memory:');
    await seedUsers(connection);

    const pageOne = await new QueryBuilder<UserRow>(connection, 'users')
      .orderBy('id')
      .paginate(5, 1);

    expect(pageOne.items.map((row) => row.name)).toEqual([
      'User 1',
      'User 2',
      'User 3',
      'User 4',
      'User 5',
    ]);
    expect(pageOne.total).toBe(12);
    expect(pageOne.lastPage).toBe(3);
    expect(pageOne.from).toBe(1);
    expect(pageOne.to).toBe(5);

    const pageThree = await new QueryBuilder<UserRow>(connection, 'users')
      .orderBy('id')
      .paginate(5, 3);

    expect(pageThree.items.map((row) => row.name)).toEqual([
      'User 11',
      'User 12',
    ]);
    expect(pageThree.from).toBe(11);
    expect(pageThree.to).toBe(12);
    expect(pageThree.onLastPage()).toBe(true);
  });

  it('paginates eloquent models and preserves eager loading', async () => {
    const connection = new SqliteConnection(':memory:');
    await seedUsers(connection);
    User.useConnection(connection);

    const paginator = await User.query().orderBy('id').paginateModels(4, 2);
    const names = paginator.items.map((user) => user.getAttribute('name'));

    expect(names).toEqual(['User 5', 'User 6', 'User 7', 'User 8']);
    expect(paginator.toArray().data).toHaveLength(4);
    expect(paginator.total).toBe(12);
  });

  it('supports Model.paginate()', async () => {
    const connection = new SqliteConnection(':memory:');
    await seedUsers(connection);
    User.useConnection(connection);

    const paginator = await User.paginate(10, 2);

    expect(paginator.items).toHaveLength(2);
    expect(paginator.currentPage).toBe(2);
    expect(paginator.perPage).toBe(10);
  });

  it('counts rows with existing where clauses', async () => {
    const connection = new SqliteConnection(':memory:');
    await seedUsers(connection);

    const count = await new QueryBuilder<UserRow>(connection, 'users')
      .where('name', 'User 1')
      .count();

    expect(count).toBe(1);
  });
});