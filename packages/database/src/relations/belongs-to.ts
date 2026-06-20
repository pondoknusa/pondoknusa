import type { Model } from '../model.js';
import type { ModelStatic } from '../model-types.js';
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

  async get(): Promise<Related | null> {
    const foreignValue = this.parent.getAttribute(this.foreignKey as never) as RowValue;
    if (foreignValue === undefined || foreignValue === null) {
      return null;
    }

    return this.relatedModel
      .query()
      .where(this.ownerKey, foreignValue)
      .firstModel<Related>();
  }
}