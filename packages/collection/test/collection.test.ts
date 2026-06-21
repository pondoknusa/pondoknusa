import { describe, it, expect } from 'vitest';
import { Collection } from '../src/collection.js';

describe('Collection', () => {
  /* ──── Construction ──────────────────────────────────────────────────── */

  it('creates from an array', () => {
    const c = new Collection([1, 2, 3]);
    expect(c.toArray()).toEqual([1, 2, 3]);
  });

  it('creates empty', () => {
    const c = new Collection<number>([]);
    expect(c.count()).toBe(0);
    expect(c.isEmpty()).toBe(true);
  });

  /* ──── Access ────────────────────────────────────────────────────────── */

  it('first() returns first item', () => {
    expect(new Collection([1, 2, 3]).first()).toBe(1);
  });

  it('first() with predicate', () => {
    expect(new Collection([1, 2, 3]).first((n) => n > 1)).toBe(2);
  });

  it('first() returns undefined when empty', () => {
    expect(new Collection([]).first()).toBeUndefined();
  });

  it('last() returns last item', () => {
    expect(new Collection([1, 2, 3]).last()).toBe(3);
  });

  it('last() with predicate', () => {
    expect(new Collection([1, 2, 3]).last((n) => n < 3)).toBe(2);
  });

  it('nth() supports negative indexing', () => {
    expect(new Collection([1, 2, 3]).nth(-1)).toBe(3);
    expect(new Collection([1, 2, 3]).nth(-3)).toBe(1);
  });

  it('count()', () => {
    expect(new Collection([1, 2, 3]).count()).toBe(3);
  });

  it('isEmpty / isNotEmpty', () => {
    expect(new Collection([]).isEmpty()).toBe(true);
    expect(new Collection([]).isNotEmpty()).toBe(false);
    expect(new Collection([1]).isNotEmpty()).toBe(true);
  });

  /* ──── Mapping / Reducing ────────────────────────────────────────────── */

  it('map()', () => {
    const result = new Collection([1, 2, 3]).map((n) => n * 2);
    expect(result.toArray()).toEqual([2, 4, 6]);
  });

  it('reduce()', () => {
    const sum = new Collection([1, 2, 3]).reduce((acc, n) => acc + n, 0);
    expect(sum).toBe(6);
  });

  it('each() is chainable', () => {
    const acc: number[] = [];
    const c = new Collection([1, 2, 3]).each((n) => acc.push(n * 2));
    expect(acc).toEqual([2, 4, 6]);
    expect(c.toArray()).toEqual([1, 2, 3]); // original unchanged
  });

  it('tap() gives side-effect access', () => {
    let captured: Collection<number> | null = null;
    const result = new Collection([1, 2]).tap((c) => {
      captured = c;
    });
    expect(captured?.toArray()).toEqual([1, 2]);
    expect(result.toArray()).toEqual([1, 2]);
  });

  it('pipe() transforms the collection', () => {
    const result = new Collection([1, 2, 3]).pipe((c) => c.sum());
    expect(result).toBe(6);
  });

  /* ──── Filtering ─────────────────────────────────────────────────────── */

  it('filter()', () => {
    const result = new Collection([1, 2, 3, 4]).filter((n) => n % 2 === 0);
    expect(result.toArray()).toEqual([2, 4]);
  });

  it('whereEq()', () => {
    const items = [{ a: 1 }, { a: 2 }, { a: 1 }];
    const result = new Collection(items).whereEq('a', 1);
    expect(result.count()).toBe(2);
  });

  it('whereIn()', () => {
    const items = [{ a: 1 }, { a: 2 }, { a: 3 }];
    expect(new Collection(items).whereIn('a', [1, 3]).count()).toBe(2);
  });

  it('whereNotIn()', () => {
    const items = [{ a: 1 }, { a: 2 }, { a: 3 }];
    expect(new Collection(items).whereNotIn('a', [2]).count()).toBe(2);
  });

  it('unique() with no arg', () => {
    expect(new Collection([1, 2, 2, 3]).unique().toArray()).toEqual([1, 2, 3]);
  });

  it('unique() with key selector', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 1 }];
    expect(new Collection(items).unique('id').count()).toBe(2);
  });

  it('skip()', () => {
    expect(new Collection([1, 2, 3]).skip(2).toArray()).toEqual([3]);
  });

  it('take()', () => {
    expect(new Collection([1, 2, 3]).take(2).toArray()).toEqual([1, 2]);
    expect(new Collection([1, 2, 3]).take(-1).toArray()).toEqual([3]);
  });

  it('forPage()', () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(new Collection(items).forPage(2, 3).toArray()).toEqual([4, 5, 6]);
    expect(new Collection(items).forPage(1, 2).toArray()).toEqual([1, 2]);
  });

  it('chunk()', () => {
    const result = new Collection([1, 2, 3, 4, 5]).chunk(2);
    expect(result.toArray()).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('split()', () => {
    const result = new Collection([1, 2, 3, 4]).split(2);
    expect(result.toArray()).toEqual([[1, 2], [3, 4]]);
  });

  /* ──── Sorting ───────────────────────────────────────────────────────── */

  it('sortBy() with key', () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const result = new Collection(items).sortBy('n');
    expect(result.pluck('n').toArray()).toEqual([1, 2, 3]);
  });

  it('sortByDesc()', () => {
    const items = [{ n: 1 }, { n: 3 }, { n: 2 }];
    expect(new Collection(items).sortByDesc('n').pluck('n').toArray()).toEqual([3, 2, 1]);
  });

  it('reverse()', () => {
    expect(new Collection([1, 2, 3]).reverse().toArray()).toEqual([3, 2, 1]);
  });

  /* ──── Grouping / Keying ─────────────────────────────────────────────── */

  it('groupBy() with key', () => {
    const items = [{ role: 'admin' }, { role: 'user' }, { role: 'admin' }];
    const grouped = new Collection(items).groupBy('role');
    const map = Object.fromEntries(grouped.toArray());
    expect(map['admin']?.length).toBe(2);
    expect(map['user']?.length).toBe(1);
  });

  it('keyBy()', () => {
    const items = [{ id: 'a', v: 1 }, { id: 'b', v: 2 }];
    const keyed = new Collection(items).keyBy('id');
    const map = Object.fromEntries(keyed.toArray());
    expect(map['a']?.v).toBe(1);
    expect(map['b']?.v).toBe(2);
  });

  it('partition()', () => {
    const [evens, odds] = new Collection([1, 2, 3, 4]).partition((n) => n % 2 === 0);
    expect(evens.toArray()).toEqual([2, 4]);
    expect(odds.toArray()).toEqual([1, 3]);
  });

  /* ──── Plucking ──────────────────────────────────────────────────────── */

  it('pluck()', () => {
    const items = [{ name: 'a' }, { name: 'b' }];
    expect(new Collection(items).pluck('name').toArray()).toEqual(['a', 'b']);
  });

  it('keys()', () => {
    expect(new Collection([{ a: 1, b: 2 }]).keys().toArray()).toEqual(['a', 'b']);
  });

  /* ──── Aggregation ───────────────────────────────────────────────────── */

  it('sum()', () => {
    expect(new Collection([1, 2, 3]).sum()).toBe(6);
  });

  it('sum() with key', () => {
    expect(new Collection([{ v: 10 }, { v: 20 }]).sum('v')).toBe(30);
  });

  it('avg()', () => {
    expect(new Collection([2, 4, 6]).avg()).toBe(4);
  });

  it('min() / max()', () => {
    expect(new Collection([3, 1, 4, 2]).min()).toBe(1);
    expect(new Collection([3, 1, 4, 2]).max()).toBe(4);
  });

  /* ──── Membership ────────────────────────────────────────────────────── */

  it('contains()', () => {
    expect(new Collection([1, 2, 3]).contains(2)).toBe(true);
    expect(new Collection([1, 2, 3]).contains(4)).toBe(false);
  });

  it('every()', () => {
    expect(new Collection([2, 4, 6]).every((n) => n % 2 === 0)).toBe(true);
    expect(new Collection([1, 2, 3]).every((n) => n % 2 === 0)).toBe(false);
  });

  /* ──── String output ─────────────────────────────────────────────────── */

  it('implode()', () => {
    expect(new Collection(['a', 'b', 'c']).implode(', ')).toBe('a, b, c');
  });

  it('join() with last glue', () => {
    expect(new Collection(['a', 'b', 'c']).join(', ', ' and ')).toBe('a, b and c');
    expect(new Collection(['a', 'b']).join(', ', ' and ')).toBe('a and b');
    expect(new Collection(['a']).join(', ')).toBe('a');
  });

  /* ──── Mutation ──────────────────────────────────────────────────────── */

  it('push()', () => {
    expect(new Collection([1, 2]).push(3, 4).toArray()).toEqual([1, 2, 3, 4]);
  });

  it('prepend()', () => {
    expect(new Collection([2, 3]).prepend(1).toArray()).toEqual([1, 2, 3]);
  });

  it('pop()', () => {
    expect(new Collection([1, 2, 3]).pop().toArray()).toEqual([1, 2]);
  });

  it('shift()', () => {
    expect(new Collection([1, 2, 3]).shift().toArray()).toEqual([2, 3]);
  });

  /* ──── Combining ─────────────────────────────────────────────────────── */

  it('concat()', () => {
    const result = new Collection([1, 2]).concat([3, 4], new Collection([5]));
    expect(result.toArray()).toEqual([1, 2, 3, 4, 5]);
  });

  it('diff()', () => {
    expect(new Collection([1, 2, 3, 4]).diff([2, 4]).toArray()).toEqual([1, 3]);
  });

  it('intersect()', () => {
    expect(new Collection([1, 2, 3]).intersect([2, 3, 4]).toArray()).toEqual([2, 3]);
  });

  it('union()', () => {
    expect(new Collection([1, 2]).union([2, 3]).toArray()).toEqual([1, 2, 3]);
  });

  /* ──── Collapsing ────────────────────────────────────────────────────── */

  it('flatten()', () => {
    const nested = new Collection([[1, 2], [3, [4]]] as unknown[]);
    expect(nested.flatten<number>().toArray()).toEqual([1, 2, 3, [4]]);
  });

  it('collapse()', () => {
    const result = new Collection([[1, 2], [3, 4]]).collapse<number>();
    expect(result.toArray()).toEqual([1, 2, 3, 4]);
  });

  /* ──── Conditionable ─────────────────────────────────────────────────── */

  it('when() applies callback on truthy', () => {
    const result = new Collection([1, 2, 3]).when(true, (c) => c.push(4));
    expect(result.toArray()).toEqual([1, 2, 3, 4]);
  });

  it('when() skips on falsy', () => {
    const result = new Collection([1, 2, 3]).when(false, (c) => c.push(4));
    expect(result.toArray()).toEqual([1, 2, 3]);
  });

  it('unless() applies callback on falsy', () => {
    const result = new Collection([1, 2, 3]).unless(true, (c) => c.push(4));
    expect(result.toArray()).toEqual([1, 2, 3]);
  });

  /* ──── Random ────────────────────────────────────────────────────────── */

  it('random() returns a single item', () => {
    const items = [10, 20, 30];
    const picked = new Collection(items).random() as number;
    expect(items).toContain(picked);
  });

  it('random(count) returns N items', () => {
    const picked = new Collection([1, 2, 3, 4, 5]).random(3) as number[];
    expect(picked).toHaveLength(3);
  });

  /* ──── Iteration ─────────────────────────────────────────────────────── */

  it('is iterable', () => {
    const result = [...new Collection([1, 2, 3])];
    expect(result).toEqual([1, 2, 3]);
  });

  it('toJSON() returns array', () => {
    expect(JSON.stringify(new Collection([{ a: 1 }]))).toBe('[{"a":1}]');
  });

  /* ──── Edge cases ────────────────────────────────────────────────────── */

  it('handles empty collection gracefully', () => {
    const c = new Collection<number>([]);
    expect(c.first()).toBeUndefined();
    expect(c.last()).toBeUndefined();
    expect(c.random()).toBeUndefined();
    expect(c.reduce((a, b) => a + b, 0)).toBe(0);
    expect(c.chunk(2).toArray()).toEqual([]);
    expect(c.sum()).toBe(0);
    expect(c.avg()).toBe(0);
  });

  it('is immutable — original unchanged after filter', () => {
    const original = new Collection([1, 2, 3, 4]);
    original.filter((n) => n > 2);
    expect(original.toArray()).toEqual([1, 2, 3, 4]);
  });
});
