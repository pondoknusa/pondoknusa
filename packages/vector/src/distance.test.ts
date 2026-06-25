import { describe, expect, it } from 'vitest';
import { cosineDistance, distanceToScore, l2Distance } from './distance.js';

describe('vector distance', () => {
  it('returns zero cosine distance for identical vectors', () => {
    expect(cosineDistance([1, 0, 0], [1, 0, 0])).toBeCloseTo(0, 5);
    expect(distanceToScore(0, 'cosine')).toBeCloseTo(1, 5);
  });

  it('computes l2 distance', () => {
    expect(l2Distance([0, 0], [3, 4])).toBe(5);
  });
});