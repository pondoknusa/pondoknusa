import type { Model } from '../model.js';
import type { ModelStatic } from '../model-types.js';

export abstract class Relation<Related extends Model = Model> {
  constructor(
    protected readonly parent: Model,
    protected readonly relatedModel: ModelStatic,
  ) {}

  abstract get(): Promise<Related | Related[] | null>;
}