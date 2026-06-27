import type { Model } from '../model.js';
import type { ModelStatic } from '../model-types.js';
import type { ModelQueryBuilder } from '../model-query-builder.js';

export interface PrunableModelStatic extends ModelStatic {
  prunable(): ModelQueryBuilder;
}

export function isPrunableModel(model: ModelStatic): model is PrunableModelStatic {
  return typeof (model as PrunableModelStatic).prunable === 'function';
}

export async function pruneModel(model: PrunableModelStatic): Promise<number> {
  const records = await model.prunable().getModels<Model>();
  let pruned = 0;

  for (const record of records) {
    if (model.softDeletes) {
      await record.forceDelete();
    } else {
      await record.delete();
    }
    pruned += 1;
  }

  return pruned;
}