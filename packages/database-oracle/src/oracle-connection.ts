import oracledb from 'oracledb';
import type { DatabaseConnection, QueryResult } from '@pondoknusa/database';
import { OracleGrammar, type SqlGrammar } from '@pondoknusa/database';
import type { OracleConnectionConfig } from './types.js';

type RowValue = string | number | bigint | boolean | null | undefined;

export class OracleConnection implements DatabaseConnection {
  readonly grammar: SqlGrammar = new OracleGrammar();
  private readonly poolPromise: Promise<oracledb.Pool>;

  constructor(config: OracleConnectionConfig) {
    const port = config.port ?? 1521;
    this.poolPromise = oracledb.createPool({
      user: config.username,
      password: config.password,
      connectString: `${config.host}:${port}/${config.database}`,
    });
  }

  async query(sql: string, bindings: RowValue[] = []): Promise<QueryResult> {
    const pool = await this.poolPromise;
    const connection = await pool.getConnection();
    try {
      return await runOracleQuery(connection, sql, bindings);
    } finally {
      await connection.close();
    }
  }

  async exec(sql: string): Promise<void> {
    const pool = await this.poolPromise;
    const connection = await pool.getConnection();
    try {
      await connection.execute(sql, [], { autoCommit: true });
    } finally {
      await connection.close();
    }
  }

  async transaction<T>(
    callback: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    const pool = await this.poolPromise;
    const connection = await pool.getConnection();

    try {
      const transactional = new OracleTransactionConnection(connection);
      const result = await callback(transactional);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.close();
    }
  }

  async close(): Promise<void> {
    const pool = await this.poolPromise;
    await pool.close(0);
  }
}

class OracleTransactionConnection implements DatabaseConnection {
  readonly grammar: SqlGrammar = new OracleGrammar();

  constructor(private readonly connection: oracledb.Connection) {}

  async query(sql: string, bindings: RowValue[] = []): Promise<QueryResult> {
    return runOracleQuery(this.connection, sql, bindings, false);
  }

  async exec(sql: string): Promise<void> {
    await this.connection.execute(sql);
  }

  async transaction<T>(
    callback: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return callback(this);
  }
}

function normalizeBindings(bindings: RowValue[]): RowValue[] {
  return bindings.map((binding) => (binding === undefined ? null : binding));
}

function isInsertSql(sql: string): boolean {
  return sql.trimStart().toLowerCase().startsWith('insert');
}

async function runOracleQuery(
  connection: oracledb.Connection,
  sql: string,
  bindings: RowValue[],
  autoCommit = true,
): Promise<QueryResult> {
  const normalized = normalizeBindings(bindings);

  if (isInsertSql(sql) && !/\breturning\b/i.test(sql)) {
    const bindParams: oracledb.BindParameters = {};
    for (const [index, value] of normalized.entries()) {
      (bindParams as Record<string, oracledb.BindParameter | RowValue>)[String(index + 1)] =
        value as oracledb.BindParameter;
    }
    (bindParams as Record<string, oracledb.BindParameter>)['out_id'] = {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    };

    const result = await connection.execute(
      `${sql} RETURNING "id" INTO :out_id`,
      bindParams,
      { autoCommit, outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    const outId = (result.outBinds as { out_id?: number[] } | undefined)?.out_id?.[0];

    return {
      rows: [],
      changes: result.rowsAffected ?? 0,
      lastInsertId: typeof outId === 'number' ? outId : undefined,
    };
  }

  const bindParams: oracledb.BindParameters = {};
  for (const [index, value] of normalized.entries()) {
    (bindParams as Record<string, oracledb.BindParameter | RowValue>)[String(index + 1)] =
      value as oracledb.BindParameter;
  }

  const result = await connection.execute(sql, bindParams, {
    autoCommit,
    outFormat: oracledb.OUT_FORMAT_OBJECT,
  });

  const rows = (result.rows ?? []) as Record<string, unknown>[];

  return {
    rows,
    changes: result.rowsAffected ?? 0,
  };
}
