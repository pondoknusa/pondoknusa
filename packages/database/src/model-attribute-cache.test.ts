import { describe, expect, it } from 'vitest';
import { Model } from './model.js';
import {
  buildAttributeCacheKey,
  clearModelAttributeCacheResolver,
  type AttributeCacheStore,
} from './model-attribute-cache.js';

class MemoryAttributeCache implements AttributeCacheStore {
  private readonly entries = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.entries.get(key) as T | undefined) ?? null;
  }

  async put(key: string, value: unknown): Promise<void> {
    this.entries.set(key, value);
  }

  async forget(key: string): Promise<boolean> {
    return this.entries.delete(key);
  }
}

type PostRow = {
  id: number;
  body: string;
  [key: string]: unknown;
};

class Post extends Model<PostRow> {
  static override table = 'posts';
  static override appends = ['comment_count'];
}

describe('Model attribute caching', () => {
  it('builds stable cache keys per model record', () => {
    expect(buildAttributeCacheKey(Post, 42, 'comment_count')).toBe(
      'model:attribute:posts:42:comment_count',
    );
  });

  it('remembers expensive accessor values', async () => {
    const cache = new MemoryAttributeCache();
    Model.setCacheResolver(() => cache);

    const post = new Post({ id: 7, body: 'Hello' });
    let computations = 0;

    const first = await post.rememberAttribute('comment_count', 60, async () => {
      computations += 1;
      return 3;
    });
    const second = await post.rememberAttribute('comment_count', 60, async () => {
      computations += 1;
      return 99;
    });

    expect(first).toBe(3);
    expect(second).toBe(3);
    expect(computations).toBe(1);

    clearModelAttributeCacheResolver();
  });

  it('forgets remembered attributes', async () => {
    const cache = new MemoryAttributeCache();
    Model.setCacheResolver(() => cache);

    const post = new Post({ id: 8, body: 'Draft' });
    let computations = 0;

    await post.rememberAttribute('comment_count', 60, async () => {
      computations += 1;
      return 1;
    });

    await post.forgetRememberedAttribute('comment_count');

    const next = await post.rememberAttribute('comment_count', 60, async () => {
      computations += 1;
      return 2;
    });

    expect(next).toBe(2);
    expect(computations).toBe(2);

    clearModelAttributeCacheResolver();
  });

  it('computes immediately when the model has no primary key', async () => {
    const cache = new MemoryAttributeCache();
    Model.setCacheResolver(() => cache);

    const post = new Post({ body: 'Unsaved' });
    let computations = 0;

    const first = await post.rememberAttribute('comment_count', 60, async () => {
      computations += 1;
      return 5;
    });
    const second = await post.rememberAttribute('comment_count', 60, async () => {
      computations += 1;
      return 6;
    });

    expect(first).toBe(5);
    expect(second).toBe(6);
    expect(computations).toBe(2);

    clearModelAttributeCacheResolver();
  });
});