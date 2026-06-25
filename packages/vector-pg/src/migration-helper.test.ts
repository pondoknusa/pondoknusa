import { describe, expect, it } from 'vitest';
import { vectorIndexSql } from './migration-helper.js';

describe('vectorIndexSql', () => {
  it('creates an ivfflat index statement', () => {
    const sql = vectorIndexSql('documents', 'embedding', 'cosine');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS');
    expect(sql).toContain('"documents"');
    expect(sql).toContain('"embedding"');
    expect(sql).toContain('vector_cosine_ops');
  });
});