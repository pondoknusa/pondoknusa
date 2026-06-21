/**
 * A reusable mixin interface for conditionally applying callbacks.
 *
 * Apply to any class to give it `when()` and `unless()` methods.
 * Usage: `class MyClass extends Conditionable { ... }`
 * or mix into an existing class hierarchy via a static helper.
 */
export class Conditionable {
  /**
   * Apply `callback` when `condition` is truthy.
   * Optionally apply `fallback` when falsy.
   */
  when<TThis extends Conditionable>(
    this: TThis,
    condition: boolean | ((instance: TThis) => boolean),
    callback: (instance: TThis) => TThis,
    fallback?: (instance: TThis) => TThis,
  ): TThis {
    const isTruthy = typeof condition === 'function' ? condition(this) : condition;
    if (isTruthy) return callback(this);
    if (fallback) return fallback(this);
    return this;
  }

  /**
   * Apply `callback` when `condition` is falsy.
   * Optionally apply `fallback` when truthy.
   */
  unless<TThis extends Conditionable>(
    this: TThis,
    condition: boolean | ((instance: TThis) => boolean),
    callback: (instance: TThis) => TThis,
    fallback?: (instance: TThis) => TThis,
  ): TThis {
    return this.when(
      typeof condition === 'function'
        ? (c) => !condition(c)
        : !condition,
      callback,
      fallback,
    );
  }
}
