export type Row = Record<string, unknown>;
export type RowValue = string | number | bigint | boolean | null | undefined;
export type WhereOperator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'like' | 'in';

export interface WhereClause {
  type: 'basic' | 'in';
  column: string;
  operator: WhereOperator;
  value: unknown;
  boolean: 'and' | 'or';
}

export interface SqliteConnectionConfig {
  driver: 'sqlite';
  database: string;
}

export interface PostgresConnectionConfig {
  driver: 'postgres';
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface MysqlConnectionConfig {
  driver: 'mysql';
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
}

export type ConnectionConfig =
  | SqliteConnectionConfig
  | PostgresConnectionConfig
  | MysqlConnectionConfig;

export interface DatabaseConfig {
  default: string;
  connections: Record<string, ConnectionConfig>;
}