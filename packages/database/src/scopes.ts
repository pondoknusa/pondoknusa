import type { ModelQueryBuilder } from './model-query-builder.js';

export type LocalScope = (
  builder: ModelQueryBuilder,
  ...args: unknown[]
) => ModelQueryBuilder | void;

export type GlobalScope = (builder: ModelQueryBuilder) => ModelQueryBuilder | void;

export function scopeMethodName(name: string): string {
  return `scope${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}