import type { ModelQueryBuilder } from './model-query-builder.js';

export type LocalScope = (
  builder: ModelQueryBuilder,
  ...args: unknown[]
) => ModelQueryBuilder | void;

export interface GlobalScope {
  readonly name: string;
  apply(builder: ModelQueryBuilder): ModelQueryBuilder | void;
}

export function createGlobalScope(
  name: string,
  apply: (builder: ModelQueryBuilder) => ModelQueryBuilder | void,
): GlobalScope {
  return { name, apply };
}

export function scopeMethodName(name: string): string {
  return `scope${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

export const SoftDeletingScope = createGlobalScope('softDeleting', (builder) => {
  builder.applySoftDeleteScope();
  return builder;
});