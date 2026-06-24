import { describe, expect, it } from 'vitest';
import {
  clearIslands,
  getIslandMount,
  listRegisteredIslands,
  registerIsland,
  unregisterIsland,
} from './island-registry.js';

describe('island registry', () => {
  it('registers and resolves island mounts', () => {
    clearIslands();
    const mount = () => undefined;
    registerIsland('counter', mount);

    expect(getIslandMount('counter')).toBe(mount);
    expect(listRegisteredIslands()).toEqual(['counter']);
  });

  it('rejects empty ids', () => {
    expect(() => registerIsland('  ', () => undefined)).toThrow(/non-empty/i);
  });

  it('unregisters islands', () => {
    clearIslands();
    registerIsland('counter', () => undefined);
    unregisterIsland('counter');

    expect(getIslandMount('counter')).toBeUndefined();
  });
});