import { describe, expect, it } from 'vitest';
import { DatabaseManager } from './database-manager.js';
import { Model } from './model.js';
import { QueryBuilder } from './query-builder.js';
import type { DatabaseConfig } from './types.js';

interface AccountRow {
  id: number;
  balance: number;
  [key: string]: unknown;
}

class Account extends Model<{ id: number; balance: number }> {
  static override table = 'accounts';
}

describe('DatabaseManager.transaction', () => {
  const config: DatabaseConfig = {
    default: 'sqlite',
    connections: {
      sqlite: { driver: 'sqlite', database: ':memory:' },
    },
  };

  async function setup() {
    const manager = new DatabaseManager(config);
    const connection = manager.connection();
    await connection.exec(`
      CREATE TABLE accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        balance INTEGER NOT NULL
      );
    `);
    await new QueryBuilder(connection, 'accounts').insert({ balance: 100 });
    Model.setConnectionResolver(() => connection);
    return manager;
  }

  it('commits work inside a transaction', async () => {
    const manager = await setup();

    await manager.transaction(async () => {
      await Account.query().where('id', 1).update({ balance: 80 });
    });

    const account = await Account.find(1);
    expect(account?.getAttribute('balance')).toBe(80);
  });

  it('rolls back when the callback throws', async () => {
    const manager = await setup();

    await expect(
      manager.transaction(async () => {
        await Account.query().where('id', 1).update({ balance: 10 });
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    const account = await Account.find(1);
    expect(account?.getAttribute('balance')).toBe(100);
  });

  it('uses the transactional connection for model queries', async () => {
    const manager = await setup();

    await manager.transaction(async () => {
      const row = await Account.query().where('id', 1).first();
      expect(row?.getAttribute('balance')).toBe(100);
      await Account.query().where('id', 1).update({ balance: 50 });
    });

    expect((await Account.find(1))?.getAttribute('balance')).toBe(50);
  });
});