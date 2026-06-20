import type { SqlGrammar } from './grammar.js';
import type { Row, RowValue } from './types.js';

export interface QueryResult {
  rows: Row[];
  changes: number;
  lastInsertId?: number | bigint;
}

export interface DatabaseConnection {
  readonly grammar: SqlGrammar;
  query(sql: string, bindings?: RowValue[]): Promise<QueryResult>;
  exec(sql: string): Promise<void>;
  transaction<T>(callback: (connection: DatabaseConnection) => Promise<T>): Promise<T>;
  close?(): Promise<void>;
}