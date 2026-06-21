import { Collection } from './collection.js';
export { Collection } from './collection.js';
export type { CollectionCallback, CollectionPredicate, KeySelector, SortSelector } from './types.js';

/** Create a new Collection from an array of items. */
export function collect<T>(items: T[] = []): Collection<T> {
  return new Collection(items);
}

