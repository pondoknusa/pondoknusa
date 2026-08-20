import { describe, expect, it } from 'vitest';
import { chunkText } from './chunk-text.js';

describe('chunkText', () => {
  it('splits long text with overlap', () => {
    const text = 'a'.repeat(1000);
    const chunks = chunkText(text, { size: 400, overlap: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 400)).toBe(true);
  });

  it('terminates when overlap >= size (no infinite loop)', () => {
    const text = 'b'.repeat(500);
    const chunks = chunkText(text, { size: 100, overlap: 100 });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every((chunk) => chunk.length <= 100)).toBe(true);
  });
});