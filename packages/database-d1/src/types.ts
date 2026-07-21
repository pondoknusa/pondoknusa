/**
 * Minimal D1 Workers binding surface (duck-typed).
 * Avoids a hard dependency on `@cloudflare/workers-types`.
 */
export interface D1Meta {
  changes?: number;
  last_row_id?: number;
  duration?: number;
  rows_read?: number;
  rows_written?: number;
}

export interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success?: boolean;
  meta?: D1Meta;
  error?: string;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<{ count?: number; duration?: number }>;
  batch?<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]>;
}

export interface D1BindingConnectionConfig {
  driver: 'd1';
  /** Workers `env.DB` (or equivalent) D1 binding. */
  binding: D1Database;
}

export interface D1HttpConnectionConfig {
  driver: 'd1';
  accountId: string;
  databaseId: string;
  apiToken: string;
}

export type D1ConnectionConfig =
  | D1BindingConnectionConfig
  | D1HttpConnectionConfig;

export function isD1BindingConfig(
  config: D1ConnectionConfig,
): config is D1BindingConnectionConfig {
  return 'binding' in config && config.binding != null;
}

export function isD1HttpConfig(
  config: D1ConnectionConfig,
): config is D1HttpConnectionConfig {
  return (
    'accountId' in config &&
    'databaseId' in config &&
    'apiToken' in config &&
    !('binding' in config && config.binding != null)
  );
}
