import { describe, expect, it } from 'vitest';
import { HasUuids } from './concerns/has-uuids.js';
import { Model } from './model.js';
import { SqliteConnection } from './sqlite-connection.js';

type DeviceRow = {
  id: string;
  name: string;
  [key: string]: unknown;
};

class Device extends HasUuids<DeviceRow> {
  static override table = 'devices';
}

describe('HasUuids', () => {
  it('assigns a string primary key on create', async () => {
    const connection = new SqliteConnection(':memory:');
    Device.useConnection(connection);

    await connection.exec(`
      CREATE TABLE devices (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

    const device = await Device.create({ name: 'Phone' });
    const id = device.getAttribute('id');

    expect(typeof id).toBe('string');
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const found = await Device.find(id!);
    expect(found?.getAttribute('name')).toBe('Phone');
  });
});