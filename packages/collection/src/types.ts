export type CollectionCallback<T, U> = (item: T, index: number) => U;
export type CollectionPredicate<T> = (item: T, index: number) => boolean;

export type KeySelector<T> = keyof T | ((item: T) => string);
export type SortSelector<T> = keyof T | ((item: T) => number | string);

// Forward declaration — Collection is imported by runtime code
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CollectionLike<T> {
  toArray(): T[];
}
