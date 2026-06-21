import { describe, expect, it } from 'vitest';
import { LengthAwarePaginator } from './paginator.js';

describe('LengthAwarePaginator', () => {
  it('resolves page and per-page values from query strings', () => {
    expect(LengthAwarePaginator.resolvePage('3')).toBe(3);
    expect(LengthAwarePaginator.resolvePage('0')).toBe(1);
    expect(LengthAwarePaginator.resolvePage(undefined, 2)).toBe(2);
    expect(LengthAwarePaginator.resolvePerPage('25')).toBe(25);
    expect(LengthAwarePaginator.resolvePerPage('500', 15, 100)).toBe(100);
  });

  it('serializes pagination metadata for API responses', () => {
    const paginator = new LengthAwarePaginator(
      [{ id: 1 }, { id: 2 }],
      12,
      5,
      2,
    );

    expect(paginator.toArray()).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      currentPage: 2,
      perPage: 5,
      total: 12,
      lastPage: 3,
      from: 6,
      to: 7,
    });
    expect(paginator.hasMorePages()).toBe(true);
    expect(paginator.onFirstPage()).toBe(false);
  });

  it('returns null range values for empty pages', () => {
    const paginator = new LengthAwarePaginator([], 0, 15, 1);

    expect(paginator.from).toBeNull();
    expect(paginator.to).toBeNull();
    expect(paginator.lastPage).toBe(1);
  });
});