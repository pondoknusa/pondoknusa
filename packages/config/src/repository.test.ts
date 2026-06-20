import { describe, expect, it } from 'vitest';
import { ConfigRepository } from './repository.js';

describe('ConfigRepository', () => {
  it('resolves dotted keys', () => {
    const config = new ConfigRepository({
      app: {
        name: 'Tyravel',
        debug: true,
      },
    });

    expect(config.get<string>('app.name')).toBe('Tyravel');
    expect(config.get<boolean>('app.debug')).toBe(true);
    expect(config.has('app.missing')).toBe(false);
  });
});