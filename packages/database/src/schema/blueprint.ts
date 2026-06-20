export class Blueprint {
  private readonly statements: string[] = [];

  constructor(private readonly tableName: string) {}

  id(name = 'id'): this {
    this.statements.push(`"${name}" INTEGER PRIMARY KEY AUTOINCREMENT`);
    return this;
  }

  string(name: string, length = 255): this {
    this.statements.push(`"${name}" VARCHAR(${length}) NOT NULL`);
    return this;
  }

  text(name: string): this {
    this.statements.push(`"${name}" TEXT NOT NULL`);
    return this;
  }

  integer(name: string): this {
    this.statements.push(`"${name}" INTEGER NOT NULL`);
    return this;
  }

  boolean(name: string): this {
    this.statements.push(`"${name}" INTEGER NOT NULL DEFAULT 0`);
    return this;
  }

  timestamps(): this {
    this.string('created_at', 64);
    this.string('updated_at', 64);
    return this;
  }

  nullable(): this {
    const last = this.statements.at(-1);
    if (!last) {
      return this;
    }
    this.statements[this.statements.length - 1] = last.replace(' NOT NULL', '');
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

    const names = Array.isArray(columns) ? columns : [columns];
    this.statements.push(
      `UNIQUE (${names.map((name) => `"${name}"`).join(', ')})`,
    );
    return this;
  }

  toCreateSql(): string {
    return `CREATE TABLE "${this.tableName}" (${this.statements.join(', ')})`;
  }

  toDropSql(): string {
    return `DROP TABLE IF EXISTS "${this.tableName}"`;
  }
}