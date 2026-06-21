import { describe, expect, it } from 'vitest';
import { DatabaseManager } from './database-manager.js';
import { Model } from './model.js';
import { QueryBuilder } from './query-builder.js';
import type { DatabaseConfig } from './types.js';

class Article extends Model<{ id: number; title: string }> {
  static override table = 'articles';
  static events: string[] = [];

  creating(): boolean {
    Article.events.push('creating');
    return true;
  }

  created(): void {
    Article.events.push('created');
  }

  updating(): boolean {
    Article.events.push('updating');
    return false;
  }
}

describe('model lifecycle hooks', () => {
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
      CREATE TABLE articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL
      );
    `);
    Model.setConnectionResolver(() => connection);
    Article.events = [];
    return connection;
  }

  it('fires creating and created on insert', async () => {
    await setup();
    await Article.create({ title: 'Hello' });
    expect(Article.events).toEqual(['creating', 'created']);
  });

  it('cancels updates when updating returns false', async () => {
    await setup();
    const article = await Article.create({ title: 'Hello' });
    Article.events = [];
    await article.update({ title: 'Changed' });

    expect(Article.events).toEqual(['updating']);
    expect(article.getAttribute('title')).toBe('Hello');
  });
});