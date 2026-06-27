import { Model } from '../model.js';
import type { ModelAttributes } from '../model-types.js';
import { generateUlid } from '../ulid.js';

export abstract class HasUlids<T extends ModelAttributes = ModelAttributes> extends Model<T> {
  static override incrementing = false;
  static override keyType = 'string' as const;

  async creating(): Promise<void> {
    const model = this.constructor as typeof Model & { primaryKey: string };
    const key = model.primaryKey;
    const current = this.getAttribute(key as keyof T);

    if (current === undefined || current === null || current === '') {
      this.setAttribute(key as keyof T, generateUlid() as T[keyof T]);
    }
  }
}