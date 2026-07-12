import type { DatabaseConnection } from './connection.js';
import type { ModelQueryBuilder } from './model-query-builder.js';
import type { RowValue } from './types.js';

export type ModelAttributes = Record<string, unknown>;

export interface ModelStatic {
  fillable?: string[];
  guarded?: string[];
  hidden?: string[];
  new (attributes?: ModelAttributes): unknown;
  name: string;
  table: string;
  primaryKey: string;
  incrementing?: boolean;
  keyType?: 'int' | 'string';
  softDeletes?: boolean;
  morphName?: string;
  vectorColumn?: string;
  getConnection(): DatabaseConnection;
  query(): ModelQueryBuilder;
  find(id: RowValue): Promise<unknown | null>;
}