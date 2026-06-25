import type { SqlGrammar } from '../grammar.js';

export class Blueprint {
  private readonly statements: string[] = [];

  constructor(
    private readonly tableName: string,
    private readonly grammar: SqlGrammar,
  ) {}

  id(name = 'id'): this {
    const column = this.column(name);
    switch (this.grammar.driver) {
      case 'postgres':
        this.statements.push(`${column} BIGSERIAL PRIMARY KEY`);
        break;
      case 'mysql':
        this.statements.push(
          `${column} BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY`,
        );
        break;
      default:
        this.statements.push(`${column} INTEGER PRIMARY KEY AUTOINCREMENT`);
        break;
    }
    return this;
  }

  string(name: string, length = 255): this {
    const column = this.column(name);
    if (this.grammar.driver === 'sqlite') {
      this.statements.push(`${column} TEXT NOT NULL`);
    } else {
      this.statements.push(`${column} VARCHAR(${length}) NOT NULL`);
    }
    return this;
  }

  text(name: string): this {
    this.statements.push(`${this.column(name)} TEXT NOT NULL`);
    return this;
  }

  vector(name: string, dimensions: number): this {
    if (this.grammar.driver !== 'postgres') {
      throw new Error(
        `vector() columns require the postgres driver (got ${this.grammar.driver}).`,
      );
    }
    this.statements.push(`${this.column(name)} vector(${dimensions}) NOT NULL`);
    return this;
  }

  integer(name: string): this {
    const column = this.column(name);
    if (this.grammar.driver === 'mysql') {
      this.statements.push(`${column} INT NOT NULL`);
    } else {
      this.statements.push(`${column} INTEGER NOT NULL`);
    }
    return this;
  }

  boolean(name: string): this {
    const column = this.column(name);
    switch (this.grammar.driver) {
      case 'postgres':
        this.statements.push(`${column} BOOLEAN NOT NULL DEFAULT FALSE`);
        break;
      case 'mysql':
        this.statements.push(`${column} TINYINT(1) NOT NULL DEFAULT 0`);
        break;
      default:
        this.statements.push(`${column} INTEGER NOT NULL DEFAULT 0`);
        break;
    }
    return this;
  }

  timestamp(name: string): this {
    const column = this.column(name);
    switch (this.grammar.driver) {
      case 'postgres':
        this.statements.push(`${column} TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL`);
        break;
      case 'mysql':
        this.statements.push(`${column} TIMESTAMP NOT NULL`);
        break;
      default:
        this.statements.push(`${column} TEXT NOT NULL`);
        break;
    }
    return this;
  }

  timestamps(): this {
    if (this.grammar.driver === 'sqlite') {
      this.string('created_at', 64);
      this.string('updated_at', 64);
      return this;
    }

    this.timestamp('created_at');
    this.timestamp('updated_at');
    return this;
  }

  nullable(): this {
    const last = this.statements.at(-1);
    if (!last) {
      return this;
    }

    let updated = last.replace(' NOT NULL', '');
    if (this.grammar.driver === 'postgres') {
      updated = updated.replace(' DEFAULT FALSE', '');
    } else if (this.grammar.driver === 'mysql') {
      updated = updated.replace(' DEFAULT 0', '');
      if (!/\bNULL\b/.test(updated)) {
        updated += ' NULL';
      }
    } else {
      updated = updated.replace(' DEFAULT 0', '');
    }

    this.statements[this.statements.length - 1] = updated;
    return this;
  }

  unique(columns?: string | string[]): this {
    if (columns === undefined) {
      const last = this.statements.at(-1);
      if (last) {
        this.statements[this.statements.length - 1] = `${last} UNIQUE`;
      }
      return this;
    }

    const names = (Array.isArray(columns) ? columns : [columns]).map((name) =>
      this.column(name),
    );
    this.statements.push(`UNIQUE (${names.join(', ')})`);
    return this;
  }

  toCreateSql(): string {
    return `CREATE TABLE ${this.table()} (${this.statements.join(', ')})`;
  }

  toDropSql(): string {
    return `DROP TABLE IF EXISTS ${this.table()}`;
  }

  private table(): string {
    return this.grammar.wrapIdentifier(this.tableName);
  }

  private column(name: string): string {
    return this.grammar.wrapIdentifier(name);
  }
}