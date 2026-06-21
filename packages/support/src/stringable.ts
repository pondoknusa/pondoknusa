import {
  slug,
  camelCase,
  kebabCase,
  snakeCase,
  studlyCase,
  title,
  lower,
  upper,
} from './str.js';

/**
 * Fluent string builder — wraps string operations in a chainable API.
 *
 * Usage:
 *   Stringable.of('hello world').slug().title().toString()
 *   // => 'Hello World'
 */
export class Stringable {
  static of(value: string): Stringable {
    return new Stringable(value);
  }

  constructor(private value: string) {}

  /* ──── Content detection ──────────────────────────────────────────── */

  /** True if the string contains the given substring. */
  contains(search: string): boolean {
    return this.value.includes(search);
  }

  /** True if the string starts with the given prefix. */
  startsWith(search: string): boolean {
    return this.value.startsWith(search);
  }

  /** True if the string ends with the given suffix. */
  endsWith(search: string): boolean {
    return this.value.endsWith(search);
  }

  /** True if the string is exactly the given value. */
  exactly(other: string): boolean {
    return this.value === other;
  }

  /** Wildcard/pattern match (`*` matches anything). */
  is(pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
    );
    return regex.test(this.value);
  }

  /** Length of the string. */
  length(): number {
    return this.value.length;
  }

  /* ──── Truncation / limiting ──────────────────────────────────────── */

  /** Truncate the string to a given length, appending an ending. */
  limit(limit: number, end = '...'): Stringable {
    if (this.value.length <= limit) return this;
    return new Stringable(this.value.slice(0, limit) + end);
  }

  /** Limit to a given number of words. */
  words(words: number, end = '...'): Stringable {
    const parts = this.value.split(/\s+/);
    if (parts.length <= words) return this;
    return new Stringable(parts.slice(0, words).join(' ') + end);
  }

  /* ──── Transformation ─────────────────────────────────────────────── */

  /** Append one or more strings. */
  append(...values: string[]): Stringable {
    return new Stringable(this.value + values.join(''));
  }

  /** Prepend one or more strings. */
  prepend(...values: string[]): Stringable {
    return new Stringable(values.join('') + this.value);
  }

  /** Get the substring after the first occurrence of `search`. */
  after(search: string): Stringable {
    const idx = this.value.indexOf(search);
    if (idx === -1) return new Stringable('');
    return new Stringable(this.value.slice(idx + search.length));
  }

  /** Get the substring after the last occurrence of `search`. */
  afterLast(search: string): Stringable {
    const idx = this.value.lastIndexOf(search);
    if (idx === -1) return new Stringable('');
    return new Stringable(this.value.slice(idx + search.length));
  }

  /** Get the substring before the first occurrence of `search`. */
  before(search: string): Stringable {
    const idx = this.value.indexOf(search);
    if (idx === -1) return this;
    return new Stringable(this.value.slice(0, idx));
  }

  /** Convert to camelCase. */
  camel(): Stringable {
    return new Stringable(camelCase(this.value));
  }

  /** Convert to kebab-case. */
  kebab(): Stringable {
    return new Stringable(kebabCase(this.value));
  }

  /** Convert to snake_case. */
  snake(): Stringable {
    return new Stringable(snakeCase(this.value));
  }

  /** Convert to StudlyCase / PascalCase. */
  studly(): Stringable {
    return new Stringable(studlyCase(this.value));
  }

  /** Convert to Title Case. */
  title(): Stringable {
    return new Stringable(title(this.value));
  }

  /** Convert to slug (lowercase, hyphen-separated). */
  slug(separator = '-'): Stringable {
    return new Stringable(slug(this.value, separator));
  }

  /** Convert to lowercase. */
  lower(): Stringable {
    return new Stringable(lower(this.value));
  }

  /** Convert to uppercase. */
  upper(): Stringable {
    return new Stringable(upper(this.value));
  }

  /** Lowercase the first character. */
  lcfirst(): Stringable {
    if (!this.value) return this;
    return new Stringable(this.value[0]!.toLowerCase() + this.value.slice(1));
  }

  /** Uppercase the first character. */
  ucfirst(): Stringable {
    if (!this.value) return this;
    return new Stringable(this.value[0]!.toUpperCase() + this.value.slice(1));
  }

  /** Ensure the string ends with the given value. */
  finish(cap: string): Stringable {
    if (this.value.endsWith(cap)) return this;
    return new Stringable(this.value + cap);
  }

  /** Ensure the string starts with the given prefix. */
  start(prefix: string): Stringable {
    if (this.value.startsWith(prefix)) return this;
    return new Stringable(prefix + this.value);
  }

  /** Replace all occurrences of `search` with `replace`. */
  replace(search: string, replace: string): Stringable {
    return new Stringable(this.value.split(search).join(replace));
  }

  /** Replace the first occurrence. */
  replaceFirst(search: string, replace: string): Stringable {
    const idx = this.value.indexOf(search);
    if (idx === -1) return this;
    return new Stringable(this.value.slice(0, idx) + replace + this.value.slice(idx + search.length));
  }

  /** Replace the last occurrence. */
  replaceLast(search: string, replace: string): Stringable {
    const idx = this.value.lastIndexOf(search);
    if (idx === -1) return this;
    return new Stringable(this.value.slice(0, idx) + replace + this.value.slice(idx + search.length));
  }

  /** Replace search strings sequentially with replacements. */
  replaceArray(search: string, replace: string[]): Stringable {
    let result = this.value;
    for (const rep of replace) {
      result = result.replace(search, rep);
    }
    return new Stringable(result);
  }

  /** Randomly shuffle the characters. */
  shuffle(): Stringable {
    const arr = [...this.value];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return new Stringable(arr.join(''));
  }

  /** Split the string by a pattern. */
  split(pattern: string | RegExp): string[] {
    return this.value.split(pattern);
  }

  /** Get a substring. */
  substr(start: number, length?: number): Stringable {
    return new Stringable(this.value.slice(start, length ? start + length : undefined));
  }

  /** Pad both sides of the string. */
  padBoth(length: number, pad = ' '): Stringable {
    return new Stringable(this.value.padStart(Math.floor((this.value.length + length) / 2), pad).padEnd(length, pad));
  }

  /** Pad the left side. */
  padLeft(length: number, pad = ' '): Stringable {
    return new Stringable(this.value.padStart(length, pad));
  }

  /** Pad the right side. */
  padRight(length: number, pad = ' '): Stringable {
    return new Stringable(this.value.padEnd(length, pad));
  }

  /** Trim whitespace (or specific chars) from both ends. */
  trim(char?: string): Stringable {
    if (!char) return new Stringable(this.value.trim());
    const re = new RegExp(`^[${char}]+|[${char}]+$`, 'g');
    return new Stringable(this.value.replace(re, ''));
  }

  /** Trim from the left. */
  ltrim(char?: string): Stringable {
    if (!char) return new Stringable(this.value.trimStart());
    const re = new RegExp(`^[${char}]+`, 'g');
    return new Stringable(this.value.replace(re, ''));
  }

  /** Trim from the right. */
  rtrim(char?: string): Stringable {
    if (!char) return new Stringable(this.value.trimEnd());
    const re = new RegExp(`[${char}]+$`, 'g');
    return new Stringable(this.value.replace(re, ''));
  }

  /** Match a regex pattern. Returns the first match. */
  match(pattern: RegExp): Stringable {
    const m = this.value.match(pattern);
    return new Stringable(m?.[0] ?? '');
  }

  /** Match all occurrences of a regex. */
  matchAll(pattern: RegExp): string[] {
    const matches: string[] = [];
    const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(this.value)) !== null) {
      matches.push(m[0]);
    }
    return matches;
  }

  /** Test if the string matches a regex. */
  test(pattern: RegExp): boolean {
    return pattern.test(this.value);
  }

  /* ──── Conditionable ──────────────────────────────────────────────── */

  /** Apply callback when condition is truthy. */
  when(
    condition: boolean | ((s: Stringable) => boolean),
    callback: (s: Stringable) => Stringable,
  ): Stringable {
    const isTruthy = typeof condition === 'function' ? condition(this) : condition;
    if (isTruthy) return callback(this);
    return this;
  }

  /** Apply callback when the string is empty. */
  whenEmpty(callback: (s: Stringable) => Stringable): Stringable {
    if (this.value.length === 0) return callback(this);
    return this;
  }

  /* ──── Output ──────────────────────────────────────────────────────── */

  toString(): string {
    return this.value;
  }

  valueOf(): string {
    return this.value;
  }

  [Symbol.toPrimitive](hint: string): string | number {
    if (hint === 'number') return Number(this.value) || 0;
    return this.value;
  }
}
