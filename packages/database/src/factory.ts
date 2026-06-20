import type { Model } from './model.js';
import type { ModelAttributes } from './model-types.js';

export abstract class Factory<
  TModel extends Model = Model,
  TAttributes extends ModelAttributes = ModelAttributes,
> {
  protected abstract readonly ModelClass: new (attributes?: Partial<TAttributes>) => TModel;

  abstract definition(): Partial<TAttributes>;

  private pendingCount = 1;

  count(amount: number): this {
    this.pendingCount = amount;
    return this;
  }

  make(attributes: Partial<TAttributes> = {}): TModel {
    return new this.ModelClass({ ...this.definition(), ...attributes });
  }

  makeMany(count: number, attributes: Partial<TAttributes> = {}): TModel[] {
    return Array.from({ length: count }, () => this.make(attributes));
  }

  async create(attributes: Partial<TAttributes> = {}): Promise<TModel | TModel[]> {
    const count = this.pendingCount;
    this.pendingCount = 1;

    const models: TModel[] = [];
    for (let index = 0; index < count; index += 1) {
      const model = this.make(attributes);
      await model.save();
      models.push(model);
    }

    return count === 1 ? models[0]! : models;
  }
}