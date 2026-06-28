import { describe, expect, it } from 'vitest';
import { ConfigRepository } from './repository.js';

describe('ConfigRepository.replace', () => {
  it('replaces the entire config tree', () => {
    const repository = new ConfigRepository({ app: { name: 'before' }, queue: { driver: 'database' } });
    repository.replace({ app: { name: 'after' } });

    expect(repository.get('app.name')).toBe('after');
    expect(repository.has('queue')).toBe(false);
  });
});