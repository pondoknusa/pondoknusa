import type { Model } from '../model.js';
import type { ModelStatic } from '../model-types.js';
import type { ModelQueryBuilder } from '../model-query-builder.js';
import type { RowValue } from '../types.js';
import { Relation } from './relation.js';

export class BelongsToRelation<Related extends Model = Model> extends Relation<Related> {
  constructor(
    parent: Model,
    relatedModel: ModelStatic,
    private readonly foreignKey: string,
    private readonly ownerKey: string,
  ) {
    super(parent, relatedModel);
  }

  query(): ModelQueryBuilder {
    const foreignValue = this.parent.getAttribute(this.foreignKey as never) as RowValue;
    return this.relatedModel.query().where(this.ownerKey, foreignValue);
  }

  async get(): Promise<Related | null> {
    const foreignValue = this.parent.getAttribute(this.foreignKey as never) as RowValue;
    if (foreignValue === undefined || foreignValue === null) {
      return null;
    }

    return this.query().firstModel<Related>();
  }

  override eagerLoadKeys(parents: Model[]): RowValue[] {
    const keys = new Set<RowValue>();
    for (const parent of parents) {
      const key = parent.getAttribute(this.foreignKey as never) as RowValue;
      if (key !== undefined && key !== null) {
        keys.add(key);
      }
    }
    return [...keys];
  }

  override defaultEagerValue(): null {
    return null;
  }

  override async eagerLoad(keys: RowValue[]): Promise<Related[]> {
    return this.relatedModel
      .query()
      .whereIn(this.ownerKey, keys)
      .getModels<Related>();
  }

  override matchEager(
    parents: Model[],
    results: unknown,
    relationName: string,
  ): void {
    const related = results as Related[];
    const dictionary = new Map<RowValue, Related>();

    for (const model of related) {
      dictionary.set(model.getAttribute(this.ownerKey as never) as RowValue, model);
    }

    for (const parent of parents) {
      const key = parent.getAttribute(this.foreignKey as never) as RowValue;
      parent.setRelation(relationName, dictionary.get(key) ?? null);
    }
  }
}