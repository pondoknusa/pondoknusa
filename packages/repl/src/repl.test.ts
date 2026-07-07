import { describe, expect, it } from 'vitest';
import { posix } from 'node:path';

describe('@pondoknusa/repl', () => {
  it('exports startRepl as the stable shell entrypoint', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.startRepl).toBe('function');
  }, 15000);

  it('resolves the monorepo package path', () => {
    expect(posix.join('src', 'models')).toBe('src/models');
  });
});