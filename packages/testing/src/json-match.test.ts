import { describe, expect, it } from 'vitest';
import { jsonContains } from './json-match.js';

describe('jsonContains', () => {
  it('matches partial objects', () => {
    expect(jsonContains({ a: 1, b: { c: 2 } }, { b: { c: 2 } })).toBe(true);
    expect(jsonContains({ a: 1 }, { a: 2 })).toBe(false);
  });
});