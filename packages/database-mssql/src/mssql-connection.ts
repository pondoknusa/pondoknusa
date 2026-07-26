import sql from 'mssql';
import type { DatabaseConnection, QueryResult } from '@pondoknusa/database';
import { MssqlGrammar, type SqlGrammar } from '@pondoknusa/database';
import type { MssqlConnectionConfig } from './types.js';

type RowValue = string | number | bigint | boolean | null | undefined;

export class MssqlConnection implements DatabaseConnection {
  readonly grammar: SqlGrammar = new MssqlGrammar();
  private readonly pool: sql.ConnectionPool;
  private readonly connected: Promise<sql.ConnectionPool>;

  constructor(config: MssqlConnectionConfig) {
    this.pool = new sql.ConnectionPool({
      server: config.host,
      port: config.port ?? 1433,
      database: config.database,
      user: config.username,
      password: config.password,
      options: {
        encrypt: config.encrypt ?? true,
        trustServerCertificate: config.trustServerCertificate ?? false,
      },
    });
    this.connected = this.pool.connect();
  }

  async query(sqlText: string, bindings: RowValue[] = []): Promise<QueryResult> {
    await this.connected;
    return runMssqlQuery(this.pool, sqlText, bindings);
  }

  async exec(sqlText: string): Promise<void> {
    await this.connected;
    await this.pool.request().query(sqlText);
  }

  async transaction<T>(
    callback: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    await this.connected;
    const tx = new sql.Transaction(this.pool);
    await tx.begin();

    try {
      const transactional = new MssqlTransactionConnection(tx);
      const result = await callback(transactional);
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.connected;
    await this.pool.close();
  }
}

class MssqlTransactionConnection implements DatabaseConnection {
  readonly grammar: SqlGrammar = new MssqlGrammar();

  constructor(private readonly tx: sql.Transaction) {}

  async query(sqlText: string, bindings: RowValue[] = []): Promise<QueryResult> {
    return runMssqlQuery(this.tx, sqlText, bindings);
  }

  async exec(sqlText: string): Promise<void> {
    await new sql.Request(this.tx).query(sqlText);
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

function isInsertSql(sqlText: string): boolean {
  return sqlText.trimStart().toLowerCase().startsWith('insert');
}

function createRequest(
  target: sql.ConnectionPool | sql.Transaction,
): sql.Request {
  return target instanceof sql.Transaction
    ? new sql.Request(target)
    : new sql.Request(target);
}

async function runMssqlQuery(
  target: sql.ConnectionPool | sql.Transaction,
  sqlText: string,
  bindings: RowValue[],
): Promise<QueryResult> {
  const request = createRequest(target);
  const normalized = normalizeBindings(bindings);

  for (const [index, value] of normalized.entries()) {
    request.input(`p${index + 1}`, value);
  }

  if (isInsertSql(sqlText)) {
    const result = await request.query(`${sqlText}; SELECT SCOPE_IDENTITY() AS id`);
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    const idRow = recordsets[1]?.[0] as { id?: number | null } | undefined;
    const lastInsertId = idRow?.id;

    return {
      rows: [],
      changes: result.rowsAffected[0] ?? 0,
      lastInsertId:
        typeof lastInsertId === 'number' ? lastInsertId : undefined,
    };
  }

  const result = await request.query(sqlText);
  const rows = (result.recordset ?? []) as Record<string, unknown>[];

  return {
    rows,
    changes: result.rowsAffected[0] ?? 0,
  };
}
