import { assertLazyLoadingAllowed } from '../lazy-loading.js';
import type { Model } from '../model.js';
import type { ModelStatic } from '../model-types.js';
import type { RowValue } from '../types.js';

export abstract class Relation<Related extends Model = Model> {
  private relationName?: string;

  constructor(
    protected readonly parent: Model,
    protected readonly relatedModel: ModelStatic,
  ) {}

  setRelationName(name: string): this {
    this.relationName = name;
    return this;
  }

  protected getRelationName(): string | undefined {
    return this.relationName;
  }

  protected async resolveGet<TResult extends Related | Related[] | null>(
    loader: () => Promise<TResult>,
  ): Promise<TResult> {
    const name = this.relationName;
    if (name && this.parent.relationLoaded(name)) {
      return this.parent.getRelation(name) as TResult;
    }

    assertLazyLoadingAllowed(this.parent, name);
    const result = await loader();

    if (name) {
      this.parent.setRelation(name, result);
    }

    return result;
  }

  abstract get(): Promise<Related | Related[] | null>;

  eagerLoadKeys(_parents: Model[]): RowValue[] {
    return [];
  }

  initRelation(parents: Model[], relationName: string): void {
    for (const parent of parents) {
      parent.setRelation(relationName, this.defaultEagerValue());
    }
  }

  defaultEagerValue(): Related | Related[] | null {
    return null;
  }

  async eagerLoad(_keys: RowValue[], _parents?: Model[]): Promise<unknown> {
    return [];
  }

  matchEager(_parents: Model[], _results: unknown, _relationName: string): void {}
}