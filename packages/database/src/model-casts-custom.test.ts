import { describe, expect, it } from 'vitest';
import { applyCastsToAttributes, type Cast, serializeAttributesForStorage } from './model-casts.js';

class UppercaseCast implements Cast {
  get(value: unknown) {
    return String(value).toUpperCase();
  }

  set(value: unknown) {
    return String(value).toLowerCase();
  }
}

describe('custom casts', () => {
  it('reads and writes via the Cast interface', () => {
    const casts = { code: new UppercaseCast() };

    expect(applyCastsToAttributes({ code: 'abc' }, casts)).toEqual({ code: 'ABC' });
    expect(serializeAttributesForStorage({ code: 'ABC' }, casts)).toEqual({ code: 'abc' });
  });
});