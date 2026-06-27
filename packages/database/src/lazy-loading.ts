import type { Model } from './model.js';

export class LazyLoadingViolationError extends Error {
  constructor(
    readonly model: string,
    readonly relation: string,
  ) {
    super(
      `Attempted to lazy load [${relation}] on model [${model}] but lazy loading is disabled.`,
    );
    this.name = 'LazyLoadingViolationError';
  }
}

let preventLazyLoading = false;

export function shouldPreventLazyLoading(): boolean {
  return preventLazyLoading;
}

export function setPreventLazyLoading(enabled: boolean): void {
  preventLazyLoading = enabled;
}

export function assertLazyLoadingAllowed(
  model: Model,
  relationName: string | undefined,
): void {
  if (!preventLazyLoading || !relationName) {
    return;
  }

  const ModelClass = model.constructor as { name: string };
  if (model.relationLoaded(relationName)) {
    return;
  }

  throw new LazyLoadingViolationError(ModelClass.name, relationName);
}