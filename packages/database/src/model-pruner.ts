import { isPrunableModel, pruneModel, type PrunableModelStatic } from './concerns/prunable.js';
import type { ModelStatic } from './model-types.js';

export interface ModelPruneReport {
  model: string;
  pruned: number;
}

export async function pruneModels(models: ModelStatic[]): Promise<ModelPruneReport[]> {
  const reports: ModelPruneReport[] = [];

  for (const model of models) {
    if (!isPrunableModel(model)) {
      continue;
    }

    const pruned = await pruneModel(model as PrunableModelStatic);
    if (pruned > 0) {
      reports.push({ model: model.name, pruned });
    }
  }

  return reports;
}