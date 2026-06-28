import { describe, expect, it } from 'vitest';
import {
  normalizePathPrefix,
  pathMatchesPrefix,
  bindingMatches,
} from './lazy-provider.js';

describe('lazy provider helpers', () => {
  it('matches route prefixes', () => {
    expect(pathMatchesPrefix('/admin', '/admin')).toBe(true);
    expect(pathMatchesPrefix('/admin/users', '/admin')).toBe(true);
    expect(pathMatchesPrefix('/api/admin', '/admin')).toBe(false);
    expect(normalizePathPrefix('admin/')).toBe('/admin');
  });

  it('matches bindings by token or constructor name', () => {
    class AdminRegistry {}

    expect(bindingMatches('admin.registry', 'admin.registry')).toBe(true);
    expect(bindingMatches(AdminRegistry, AdminRegistry)).toBe(true);
    expect(bindingMatches('admin.registry', 'debug.store')).toBe(false);
  });
});