import { describe, it, expect, vi } from 'vitest';
import {
  now,
  today,
  collect,
  rescue,
  retry,
  report,
  throw_if,
  throw_unless,
  value,
  withValue,
  transform,
  optional,
  head,
  last,
  class_basename,
} from '../src/helpers.js';

describe('helpers', () => {
  /* ──── Time ──────────────────────────────────────────────────────── */
  it('now() returns a Date', () => {
    const d = now();
    expect(d).toBeInstanceOf(Date);
    expect(d.getTime()).toBeGreaterThan(0);
  });

  it('today() returns YYYY-MM-DD', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  /* ──── Collection ────────────────────────────────────────────────── */
  it('collect() creates a Collection', () => {
    const c = collect([1, 2, 3]);
    expect(c.count()).toBe(3);
    expect(c.map((n) => n * 2).toArray()).toEqual([2, 4, 6]);
  });

  it('collect() with no args creates empty', () => {
    expect(collect().isEmpty()).toBe(true);
  });

  /* ──── Error handling ────────────────────────────────────────────── */
  it('rescue() returns fn result', () => {
    expect(rescue(() => 42)).toBe(42);
  });

  it('rescue() returns fallback on throw', () => {
    expect(rescue(() => { throw new Error('fail'); }, 'fallback')).toBe('fallback');
  });

  it('retry() succeeds on first try', async () => {
    const result = await retry(3, () => 'ok');
    expect(result).toBe('ok');
  });

  it('retry() retries on failure', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('not yet');
      return 'finally';
    };
    const result = await retry(3, fn);
    expect(result).toBe('finally');
    expect(attempts).toBe(3);
  });

  it('retry() throws after exhausting attempts', async () => {
    await expect(retry(2, async () => { throw new Error('always'); }, 0)).rejects.toThrow('always');
  });

  it('report() logs to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    report(new Error('test'));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  /* ──── Conditionals ──────────────────────────────────────────────── */
  it('throw_if throws when truthy', () => {
    expect(() => throw_if(true, new Error('boom'))).toThrow('boom');
  });

  it('throw_if does not throw when falsy', () => {
    expect(() => throw_if(false, new Error('boom'))).not.toThrow();
  });

  it('throw_unless throws when falsy', () => {
    expect(() => throw_unless(false, new Error('boom'))).toThrow('boom');
  });

  it('throw_unless does not throw when truthy', () => {
    expect(() => throw_unless(true, new Error('boom'))).not.toThrow();
  });

  /* ──── Value manipulation ────────────────────────────────────────── */
  it('value() returns scalar', () => {
    expect(value(42)).toBe(42);
  });

  it('value() calls function', () => {
    expect(value(() => 42)).toBe(42);
  });

  it('withValue() calls fn and returns value', () => {
    const sideEffects: number[] = [];
    const result = withValue(42, (n) => { sideEffects.push(n); });
    expect(result).toBe(42);
    expect(sideEffects).toEqual([42]);
  });

  it('transform() applies fn to non-null value', () => {
    expect(transform(' hello ', (s) => s.trim())).toBe('hello');
  });

  it('transform() returns fallback for null', () => {
    expect(transform(null, (s: string) => s.trim(), 'default')).toBe('default');
  });

  it('optional() returns obj for valid key', () => {
    expect(optional({ a: 1 }, 'a')).toBe(1);
  });

  it('optional() returns undefined for null obj', () => {
    expect(optional(null, 'a')).toBeUndefined();
  });

  /* ──── Array helpers ─────────────────────────────────────────────── */
  it('head() returns first element', () => {
    expect(head([1, 2, 3])).toBe(1);
  });

  it('head() returns undefined for empty', () => {
    expect(head([])).toBeUndefined();
  });

  it('last() returns last element', () => {
    expect(last([1, 2, 3])).toBe(3);
  });

  it('last() returns undefined for empty', () => {
    expect(last([])).toBeUndefined();
  });

  /* ──── Reflection ────────────────────────────────────────────────── */
  it('class_basename() returns class name', () => {
    class FooBar {}
    expect(class_basename(FooBar)).toBe('FooBar');
    expect(class_basename(new FooBar())).toBe('FooBar');
  });
});
