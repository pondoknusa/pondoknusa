import { describe, expect, it } from 'vitest';
import { castAttribute, serializeCast } from './model-casts.js';

describe('model casts', () => {
  it('casts json strings to objects', () => {
    expect(castAttribute('{"a":1}', 'json')).toEqual({ a: 1 });
  });

  it('casts booleans from storage values', () => {
    expect(castAttribute(1, 'boolean')).toBe(true);
    expect(castAttribute(0, 'boolean')).toBe(false);
  });

  it('serializes json for storage', () => {
    expect(serializeCast({ a: 1 }, 'json')).toBe('{"a":1}');
  });

  it('serializes datetime to unix timestamp', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    expect(serializeCast(date, 'datetime')).toBe(Math.floor(date.getTime() / 1000));
  });
});