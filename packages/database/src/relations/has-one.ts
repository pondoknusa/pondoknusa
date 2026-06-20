import type { Model } from '../model.js';
import type { ModelStatic } from '../model-types.js';
import type { ModelQueryBuilder } from '../model-query-builder.js';
import type { RowValue } from '../types.js';
import { Relation } from './relation.js';

export class HasOneRelation<Related extends Model = Model> extends Relation<Related> {
  constructor(
    parent: Model,
    relatedModel: ModelStatic,
    private readonly foreignKey: string,
    private readonly localKey: string,
  ) {
    super(parent, relatedModel);
  }

  query(): ModelQueryBuilder {
    const localValue = this.parent.getAttribute(this.localKey as never) as RowValue;
    return this.relatedModel.query().where(this.foreignKey, localValue);
  }

  async get(): Promise<Related | null> {
    return this.query().firstModel<Related>();
  }
}