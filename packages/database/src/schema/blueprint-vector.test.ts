import { describe, expect, it } from 'vitest';
import { PostgresGrammar, SqliteGrammar } from '../grammar.js';
import { Blueprint } from './blueprint.js';

describe('Blueprint.vector', () => {
  it('creates pgvector columns on postgres', () => {
    const blueprint = new Blueprint('documents', new PostgresGrammar());
    blueprint.id();
    blueprint.vector('embedding', 1536);
    expect(blueprint.toCreateSql()).toContain('"embedding" vector(1536) NOT NULL');
  });

  it('rejects vector columns on sqlite', () => {
    const blueprint = new Blueprint('documents', new SqliteGrammar());
    expect(() => blueprint.vector('embedding', 1536)).toThrow(/postgres driver/);
  });
});