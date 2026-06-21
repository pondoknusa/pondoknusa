import type {
  CollectionCallback,
  CollectionPredicate,
  KeySelector,
  SortSelector,
} from './types.js';

/**
 * Fluent, type-safe, chainable collection — inspired by Laravel's Collection.
 * Every method returns a new instance (immutable) unless noted.
 */
export class Collection<T> {
  constructor(private items: T[]) {}

  /* ──── Access ─────────────────────────────────────────────────────────── */

  /** All items as a plain array. */
  toArray(): T[] {
    return [...this.items];
  }

  /** JSON serialization returns the plain array. */
  toJSON(): T[] {
    return this.toArray();
  }

  /** Number of items. */
  count(): number {
    return this.items.length;
  }

  /** True when the collection is empty. */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** True when the collection has items. */
  isNotEmpty(): boolean {
    return this.items.length > 0;
  }

  /** First item, or undefined if empty. Optionally filtered by predicate. */
  first(predicate?: CollectionPredicate<T>): T | undefined {
    if (!predicate) return this.items[0];
    return this.items.find(predicate);
  }

  /** Last item, or undefined if empty. */
  last(predicate?: CollectionPredicate<T>): T | undefined {
    if (!predicate) return this.items[this.items.length - 1];
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (predicate(this.items[i]!, i)) return this.items[i];
    }
    return undefined;
  }

  /** Item at the given index (supports negative). */
  nth(index: number): T | undefined {
    if (index < 0) index = this.items.length + index;
    return this.items[index];
  }

  /* ──── Mapping / Reducing ────────────────────────────────────────────── */

  /** Map each item through a callback. */
  map<U>(callback: CollectionCallback<T, U>): Collection<U> {
    return new Collection(this.items.map(callback));
  }

  /** Reduce the collection to a single value. */
  reduce<U>(callback: (acc: U, item: T, index: number) => U, initial: U): U {
    return this.items.reduce(callback, initial);
  }

  /** Apply a side-effect to each item, return the same collection (chainable). */
  each(callback: CollectionCallback<T, void>): this {
    this.items.forEach(callback);
    return this;
  }

  /** Tap into a chain — pass the collection to a callback for side-effects. */
  tap(callback: (collection: this) => void): this {
    callback(this);
    return this;
  }

  /** Pipe the collection through a transform and return the result. */
  pipe<U>(callback: (collection: this) => U): U {
    return callback(this);
  }

  /* ──── Filtering ──────────────────────────────────────────────────────── */

  /** Keep items matching the predicate. */
  filter(predicate: CollectionPredicate<T>): Collection<T> {
    return new Collection(this.items.filter(predicate));
  }

  /** Alias for filter. */
  where(predicate: CollectionPredicate<T>): Collection<T> {
    return this.filter(predicate);
  }

  /** Items where the given key strictly equals the given value. */
  whereEq<K extends keyof T>(key: K, value: T[K]): Collection<T> {
    return this.filter((item) => item[key] === value);
  }

  /** Items where key in array of values. */
  whereIn<K extends keyof T>(key: K, values: T[K][]): Collection<T> {
    const set = new Set(values);
    return this.filter((item) => set.has(item[key]));
  }

  /** Items where key NOT in array of values. */
  whereNotIn<K extends keyof T>(key: K, values: T[K][]): Collection<T> {
    const set = new Set(values);
    return this.filter((item) => !set.has(item[key]));
  }

  /** Items where key is not null/undefined. */
  whereNotNull<K extends keyof T>(key: K): Collection<T> {
    return this.filter((item) => item[key] != null);
  }

  /** Items where the given key is strictly null or undefined. */
  whereNull<K extends keyof T>(key: K): Collection<T> {
    return this.filter((item) => item[key] == null);
  }

  /** Remove duplicate items. Uses strict equality by default. */
  unique(keySelector?: KeySelector<T>): Collection<T> {
    if (!keySelector) return new Collection([...new Set(this.items)]);

    const seen = new Set<string>();
    return this.filter((item) => {
      const key =
        typeof keySelector === 'function'
          ? keySelector(item)
          : String(item[keySelector]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /** Skip the first N items. */
  skip(count: number): Collection<T> {
    return new Collection(this.items.slice(count));
  }

  /** Take the first N items (or last if negative). */
  take(count: number): Collection<T> {
    if (count < 0) return new Collection(this.items.slice(count));
    return new Collection(this.items.slice(0, count));
  }

  /** Items for a given page (1-indexed). */
  forPage(page: number, perPage: number): Collection<T> {
    return this.slice((page - 1) * perPage, perPage);
  }

  /** Slice the collection. */
  slice(offset: number, length?: number): Collection<T> {
    return new Collection(this.items.slice(offset, length ? offset + length : undefined));
  }

  /** Split the collection into chunks of the given size. */
  chunk(size: number): Collection<T[]> {
    const chunks: T[][] = [];
    for (let i = 0; i < this.items.length; i += size) {
      chunks.push(this.items.slice(i, i + size));
    }
    return new Collection(chunks);
  }

  /** Split into N roughly equal groups. */
  split(count: number): Collection<T[]> {
    const size = Math.ceil(this.items.length / count);
    return this.chunk(size);
  }

  /* ──── Sorting ────────────────────────────────────────────────────────── */

  /** Sort ascending by the given key or comparator. */
  sortBy(selector: SortSelector<T>): Collection<T> {
    const sorted = [...this.items].sort((a, b) => {
      const aVal =
        typeof selector === 'function' ? selector(a) : (a[selector] as number | string);
      const bVal =
        typeof selector === 'function' ? selector(b) : (b[selector] as number | string);
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
    return new Collection(sorted);
  }

  /** Sort descending by the given key or comparator. */
  sortByDesc(selector: SortSelector<T>): Collection<T> {
    return this.sortBy(selector).reverse();
  }

  /** Sort with a custom comparator function. */
  sort(comparator: (a: T, b: T) => number): Collection<T> {
    return new Collection([...this.items].sort(comparator));
  }

  /** Reverse the order of items. */
  reverse(): Collection<T> {
    return new Collection([...this.items].reverse());
  }

  /** Randomly shuffle the items. */
  shuffle(): Collection<T> {
    const shuffled = [...this.items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return new Collection(shuffled);
  }

  /* ──── Grouping / Keying ──────────────────────────────────────────────── */

  /** Group items by the given key. Returns a collection of `[key, items]` pairs. */
  groupBy(selector: KeySelector<T>): Collection<[string, T[]]> {
    const map = new Map<string, T[]>();
    for (const item of this.items) {
      const key =
        typeof selector === 'function'
          ? selector(item)
          : String(item[selector]);
      const group = map.get(key);
      if (group) {
        group.push(item);
      } else {
        map.set(key, [item]);
      }
    }
    return new Collection([...map.entries()]);
  }

  /** Key the collection by the given selector (last wins on duplicates). */
  keyBy(selector: KeySelector<T>): Collection<[string, T]> {
    const map = new Map<string, T>();
    for (const item of this.items) {
      const key =
        typeof selector === 'function'
          ? selector(item)
          : String(item[selector]);
      map.set(key, item);
    }
    return new Collection([...map.entries()]);
  }

  /** Partition into two collections: [matching, non-matching]. */
  partition(predicate: CollectionPredicate<T>): [Collection<T>, Collection<T>] {
    const pass: T[] = [];
    const fail: T[] = [];
    for (let i = 0; i < this.items.length; i++) {
      if (predicate(this.items[i]!, i)) {
        pass.push(this.items[i]!);
      } else {
        fail.push(this.items[i]!);
      }
    }
    return [new Collection(pass), new Collection(fail)];
  }

  /* ──── Plucking ───────────────────────────────────────────────────────── */

  /** Extract a single key's values from each item. */
  pluck<K extends keyof T>(key: K): Collection<T[K]> {
    return new Collection(this.items.map((item) => item[key]));
  }

  /** Return the values of the collection (identity). */
  values(): Collection<T> {
    return new Collection([...this.items]);
  }

  /** Return the keys of the first item, or an empty collection. */
  keys(): Collection<string> {
    if (this.items.length === 0) return new Collection([]);
    return new Collection(Object.keys(this.items[0]!));
  }

  /* ──── Aggregation ────────────────────────────────────────────────────── */

  /** Sum of values for a key, or sum of items (if numeric). */
  sum(key?: keyof T): number {
    return this.items.reduce((acc, item) => {
      const val = key ? (item[key] as number) : (item as unknown as number);
      return acc + (typeof val === 'number' ? val : Number(val) || 0);
    }, 0);
  }

  /** Average of values for a key, or average of items (if numeric). */
  avg(key?: keyof T): number {
    if (this.items.length === 0) return 0;
    return this.sum(key) / this.items.length;
  }

  /** Numeric minimum. */
  min(key?: keyof T): number {
    const vals = this.items.map((item) =>
      key ? (item[key] as number) : (item as unknown as number),
    );
    return Math.min(...vals);
  }

  /** Numeric maximum. */
  max(key?: keyof T): number {
    const vals = this.items.map((item) =>
      key ? (item[key] as number) : (item as unknown as number),
    );
    return Math.max(...vals);
  }

  /* ──── Membership ─────────────────────────────────────────────────────── */

  /** True if the collection contains the value (strict equality). */
  contains(value: T): boolean {
    return this.items.includes(value);
  }

  /** True if the collection contains any item matching the predicate. */
  containsWhere(predicate: CollectionPredicate<T>): boolean {
    return this.items.some(predicate);
  }

  /** True if every item matches the predicate. */
  every(predicate: CollectionPredicate<T>): boolean {
    return this.items.every(predicate);
  }

  /* ──── String output ──────────────────────────────────────────────────── */

  /** Join items with a glue string. */
  implode(glue: string): string {
    return this.items.join(glue);
  }

  /** Join items, with an optional last separator (like in English lists). */
  join(glue: string, lastGlue?: string): string {
    const len = this.items.length;
    if (len === 0) return '';
    if (len === 1) return String(this.items[0]);
    if (len === 2) return `${this.items[0]}${lastGlue ?? glue}${this.items[1]}`;
    const head = this.items.slice(0, -1).join(glue);
    return `${head}${lastGlue ?? glue}${this.items[len - 1]}`;
  }

  /* ──── Mutation (returns new Collection) ──────────────────────────────── */

  /** Add item(s) to the end. */
  push(...values: T[]): Collection<T> {
    return new Collection([...this.items, ...values]);
  }

  /** Prepend item(s) to the start. */
  prepend(...values: T[]): Collection<T> {
    return new Collection([...values, ...this.items]);
  }

  /** Pop the last item off. */
  pop(): Collection<T> {
    return new Collection(this.items.slice(0, -1));
  }

  /** Shift the first item off. */
  shift(): Collection<T> {
    return new Collection(this.items.slice(1));
  }

  /** Replace items at the given offset. */
  splice(offset: number, deleteCount?: number, ...replacements: T[]): Collection<T> {
    const copy = [...this.items];
    copy.splice(offset, deleteCount ?? copy.length - offset, ...replacements);
    return new Collection(copy);
  }

  /* ──── Combining ──────────────────────────────────────────────────────── */

  /** Concatenate one or more collections/arrays. */
  concat(...sources: (Collection<T> | T[])[]): Collection<T> {
    const all = [...this.items];
    for (const src of sources) {
      if (src instanceof Collection) {
        all.push(...src.toArray());
      } else {
        all.push(...src);
      }
    }
    return new Collection(all);
  }

  /** Merge an array or collection into this one, overwriting by key (objects). */
  merge(source: Collection<Partial<T>> | Partial<T>[]): Collection<T> {
    const entries = source instanceof Collection ? source.toArray() : source;
    return new Collection([...this.items, ...entries] as T[]);
  }

  /** Items in this collection that are not in the other. */
  diff(other: Collection<T> | T[]): Collection<T> {
    const set = new Set(other instanceof Collection ? other.toArray() : other);
    return this.filter((item) => !set.has(item));
  }

  /** Items present in both collections. */
  intersect(other: Collection<T> | T[]): Collection<T> {
    const set = new Set(other instanceof Collection ? other.toArray() : other);
    return this.filter((item) => set.has(item));
  }

  /** Union — items from both collections, deduplicated. */
  union(other: Collection<T> | T[]): Collection<T> {
    return this.push(...(other instanceof Collection ? other.toArray() : other)).unique();
  }

  /* ──── Collapsing ─────────────────────────────────────────────────────── */

  /** Flatten a collection of arrays/collections one level deep. */
  flatten<U>(depth = 1): Collection<U> {
    let result: unknown[] = this.items;
    for (let d = 0; d < depth; d++) {
      result = result.flat();
    }
    return new Collection(result as U[]);
  }

  /** Collapse a collection of arrays into a flat collection. */
  collapse<U>(): Collection<U> {
    const result: U[] = [];
    for (const item of this.items) {
      if (Array.isArray(item)) {
        result.push(...(item as unknown as U[]));
      }
    }
    return new Collection(result);
  }

  /* ──── Conditionable ──────────────────────────────────────────────────── */

  /** Apply callback when the condition is truthy. */
  when(
    condition: boolean | ((collection: this) => boolean),
    callback: (collection: this) => this,
    fallback?: (collection: this) => this,
  ): this {
    const isTruthy = typeof condition === 'function' ? condition(this) : condition;
    if (isTruthy) return callback(this);
    if (fallback) return fallback(this);
    return this;
  }

  /** Apply callback when the condition is falsy. */
  unless(
    condition: boolean | ((collection: this) => boolean),
    callback: (collection: this) => this,
    fallback?: (collection: this) => this,
  ): this {
    return this.when(
      typeof condition === 'function'
        ? (c) => !condition(c)
        : !condition,
      callback,
      fallback,
    );
  }

  /* ──── Random ─────────────────────────────────────────────────────────── */

  /** Return a single random item, or N random items. */
  random(count?: number): T | T[] | undefined {
    if (count === undefined) {
      if (this.items.length === 0) return undefined;
      return this.items[Math.floor(Math.random() * this.items.length)]!;
    }
    const shuffled = this.shuffle();
    return shuffled.take(count).toArray();
  }

  /* ───── Utility ───────────────────────────────────────────────────────── */

  /** Return a collection with only the given keys (for objects). */
  only<K extends keyof T>(keys: K[]): Collection<Pick<T, K>> {
    return new Collection(
      this.items.map((item) => {
        const picked = {} as Pick<T, K>;
        for (const key of keys) {
          picked[key] = item[key];
        }
        return picked;
      }),
    );
  }

  /** Return a collection without the given keys. */
  except<K extends keyof T>(keys: K[]): Collection<Omit<T, K>> {
    const keySet = new Set(keys);
    return new Collection(
      this.items.map((item) => {
        const rest = { ...item } as Record<string, unknown>;
        for (const key of keySet) {
          delete rest[key as string];
        }
        return rest as Omit<T, K>;
      }),
    );
  }

  /* ──── Iteration ──────────────────────────────────────────────────────── */

  *[Symbol.iterator](): Iterator<T> {
    for (const item of this.items) {
      yield item;
    }
  }
}
