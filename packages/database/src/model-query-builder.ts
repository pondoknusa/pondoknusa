import type { DatabaseConnection } from './connection.js';
import { EagerLoader } from './eager-loader.js';
import { QueryBuilder } from './query-builder.js';
import type { Model } from './model.js';
import type { ModelAttributes, ModelStatic } from './model-types.js';
import { scopeMethodName, type GlobalScope, type LocalScope } from './scopes.js';

export class ModelQueryBuilder extends QueryBuilder {
  protected eagerLoad: string[] = [];

  constructor(
    connection: DatabaseConnection,
    tableName: string,
    private readonly model: ModelStatic,
  ) {
    super(connection, tableName);
  }

  with(...relations: string[]): this {
    this.eagerLoad.push(...relations);
    return this;
  }

  override clone(): ModelQueryBuilder {
    const builder = new ModelQueryBuilder(
      this.connection,
      this.getTableName(),
      this.model,
    );
    this.copyTo(builder);
    return builder;
  }

  protected override copyTo(builder: QueryBuilder): void {
    super.copyTo(builder);
    if (builder instanceof ModelQueryBuilder) {
      builder.eagerLoad = [...this.eagerLoad];
    }
  }

  applyScope(name: string, ...args: unknown[]): this {
    const scopeName = scopeMethodName(name);
    const scope = (this.model as unknown as Record<string, LocalScope | undefined>)[
      scopeName
    ];

    if (!scope) {
      throw new Error(`Scope [${name}] not defined on model [${this.model.name}].`);
    }

    const result = scope.call(this.model, this, ...args);
    return (result as this) ?? this;
  }

  async getModels<TModel extends Model>(): Promise<TModel[]> {
    const rows = await this.get();
    const ModelClass = this.model as new (
      attributes?: Partial<ModelAttributes>,
    ) => TModel;
    const models = rows.map((row) => new ModelClass(row));

    if (this.eagerLoad.length > 0) {
      await EagerLoader.load(models, this.eagerLoad, this.model);
    }

    return models;
  }

  async firstModel<TModel extends Model>(): Promise<TModel | null> {
    const rows = await this.clone().limit(1).getModels<TModel>();
    return rows[0] ?? null;
  }
}

export function applyGlobalScopes(
  builder: ModelQueryBuilder,
  scopes: GlobalScope[],
): ModelQueryBuilder {
  let current = builder;
  for (const scope of scopes) {
    const result = scope(current);
    if (result) {
      current = result;
    }
  }
  return current;
}