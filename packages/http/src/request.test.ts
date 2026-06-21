import { describe, expect, it } from 'vitest';
import { TyravelRequest } from './request.js';

describe('TyravelRequest', () => {
  it('reads page and per_page query parameters', () => {
    const request = new TyravelRequest(
      new Request('http://localhost/users?page=3&per_page=25'),
    );

    expect(request.page()).toBe(3);
    expect(request.perPage()).toBe(25);
    expect(request.page('page', 1)).toBe(3);
    expect(request.perPage('per_page', 15, 20)).toBe(20);
  });

  it('falls back when query values are invalid', () => {
    const request = new TyravelRequest(
      new Request('http://localhost/users?page=0&per_page=-5'),
    );

    expect(request.page()).toBe(1);
    expect(request.perPage()).toBe(15);
  });
});