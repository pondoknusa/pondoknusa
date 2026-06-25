import type { DatabaseConnection } from './connection.js';
import { EagerLoader } from './eager-loader.js';
import { applyCastsToAttributes } from './model-casts.js';
import { LengthAwarePaginator } from './paginator.js';
import { QueryBuilder } from './query-builder.js';
import type { Model } from './model.js';
import type { ModelAttributes, ModelStatic } from './model-types.js';
import { scopeMethodName, type GlobalScope, type LocalScope } from './scopes.js';

export class ModelQueryBuilder extends QueryBuilder {
  protected eagerLoad: string[] = [];
  private withTrashed = false;
  private onlyTrashed = false;

  constructor(
    connection: DatabaseConnection,
    tableName: string,
    private readonly model: ModelStatic,
  ) {
    super(connection, tableName);
  }

  getModel(): ModelStatic {
    return this.model;
  }

  with(...relations: string[]): this {
    this.eagerLoad.push(...relations);
    return this;
  }

  withTrashedModels(): this {
    this.withTrashed = true;
    return this;
  }

  onlyTrashedModels(): this {
    this.withTrashed = true;
    this.onlyTrashed = true;
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
      builder.withTrashed = this.withTrashed;
      builder.onlyTrashed = this.onlyTrashed;
    }
  }

  protected applySoftDeleteScope(): void {
    const model = this.model as typeof Model;
    if (!model.softDeletes || this.withTrashed) {
      return;
    }

    if (this.onlyTrashed) {
      this.whereNotNull(model.deletedAt);
      return;
    }

    this.whereNull(model.deletedAt);
  }

  override async get(): Promise<Record<string, unknown>[]> {
    this.applySoftDeleteScope();
    return super.get();
  }

  override async count(column = '*'): Promise<number> {
    this.applySoftDeleteScope();
    return super.count(column);
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
    const casts = (this.model as typeof Model).casts;
    const models = rows.map((row) => {
      const attributes = Object.keys(casts).length > 0
        ? applyCastsToAttributes(row, casts)
        : row;
      return new ModelClass(attributes);
    });

    if (this.eagerLoad.length > 0) {
      await EagerLoader.load(models, this.eagerLoad, this.model);
    }

    return models;
  }

  async firstModel<TModel extends Model>(): Promise<TModel | null> {
    const rows = await this.clone().limit(1).getModels<TModel>();
    return rows[0] ?? null;
  }

  async paginateModels<TModel extends Model>(
    perPage = 15,
    page = 1,
  ): Promise<LengthAwarePaginator<TModel>> {
    const resolvedPage = LengthAwarePaginator.resolvePage(page);
    const resolvedPerPage = LengthAwarePaginator.resolvePerPage(perPage);
    const total = await this.clone().count();
    const items = await this.clone()
      .offset((resolvedPage - 1) * resolvedPerPage)
      .limit(resolvedPerPage)
      .getModels<TModel>();

    return new LengthAwarePaginator(items, total, resolvedPerPage, resolvedPage);
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