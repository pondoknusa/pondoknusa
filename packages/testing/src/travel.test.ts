import { afterEach, describe, expect, it, vi } from 'vitest';
import { back, freezeTime, travel } from './travel.js';

describe('time travel helpers', () => {
  afterEach(() => {
    back();
  });

  it('advances the system clock', () => {
    freezeTime('2026-01-01T00:00:00.000Z');
    travel(2).days();
    expect(Date.now()).toBe(new Date('2026-01-03T00:00:00.000Z').getTime());
  });
});