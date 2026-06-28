import { describe, expect, it } from 'vitest';
import { Model } from './model.js';
import { setModelAttributeCacheResolver } from './model-attribute-cache.js';
import type { AttributeCacheStore } from './model-attribute-cache.js';
import { SqliteConnection } from './sqlite-connection.js';

class Article extends Model {
  static override table = 'articles';
}

function createMemoryCache(): AttributeCacheStore {
  const store = new Map<string, unknown>();
  return {
    get: async (key) => (store.has(key) ? (store.get(key) as never) : null),
    put: async (key, value) => {
      store.set(key, value);
    },
    forget: async (key) => store.delete(key),
    remember: async (key, _ttl, callback) => {
      if (store.has(key)) {
        return store.get(key) as never;
      }

      const value = await callback();
      store.set(key, value);
      return value;
    },
  };
}

describe('Model.remember', () => {
  it('caches expensive query results by key', async () => {
    const connection = new SqliteConnection(':memory:');
    Article.useConnection(connection);
    const cache = createMemoryCache();
    setModelAttributeCacheResolver(() => cache);

    await connection.exec(`
      CREATE TABLE articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL
      )
    `);

    await Article.create({ title: 'First' });
    let queries = 0;

    const load = () =>
      Article.remember('all-titles', 60, async () => {
        queries += 1;
        return Article.all();
      });

    const first = await load();
    const second = await load();

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(queries).toBe(1);

    await Article.forgetRemembered('all-titles');
    await load();
    expect(queries).toBe(2);

    await connection.close();
  });
});