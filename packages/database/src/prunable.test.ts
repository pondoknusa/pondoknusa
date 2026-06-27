import { describe, expect, it } from 'vitest';
import { pruneModel } from './concerns/prunable.js';
import { Model } from './model.js';
import type { ModelQueryBuilder } from './model-query-builder.js';
import { SqliteConnection } from './sqlite-connection.js';

type LogRow = {
  id: number;
  message: string;
  created_at: number;
  [key: string]: unknown;
};

class AuditLog extends Model<LogRow> {
  static override table = 'audit_logs';

  static prunable(): ModelQueryBuilder {
    const cutoff = Math.floor(Date.now() / 1000) - 60;
    return this.query().where('created_at', '<', cutoff);
  }
}

describe('prunable models', () => {
  it('deletes records matched by prunable()', async () => {
    const connection = new SqliteConnection(':memory:');
    AuditLog.useConnection(connection);

    await connection.exec(`
      CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    const now = Math.floor(Date.now() / 1000);
    await AuditLog.create({ message: 'old', created_at: now - 120 });
    await AuditLog.create({ message: 'fresh', created_at: now });

    const pruned = await pruneModel(AuditLog);
    expect(pruned).toBe(1);
    expect(await AuditLog.all()).toHaveLength(1);
    expect((await AuditLog.all())[0]?.getAttribute('message')).toBe('fresh');
  });
});